import type { ApolloClient } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action, mergeItemsWithUuid } from './utils';
import { type SearchQuery, type SearchQueryVariables, Search } from "@/shared/graphql/operations";
import type { ComicSeries, Genre } from "@/shared/graphql/types";

/* Actions */
export const SEARCH = asyncAction(ActionTypes.SEARCH);
export const SEARCH_DEBOUNCED = 'SEARCH_DEBOUNCED'; // New action type for debounced search

/* Action Creators */
interface SearchProps {
  publicClient: ApolloClient<any>;
  term: string;
  page?: number;
  limitPerPage?: number;
  filterForTypes?: string[];
  filterForTags?: string[];
  filterForGenres?: Genre[];
  isLoadingMore?: boolean;
  forceRefresh?: boolean;
}

// Debounce utility
let searchDebounceTimer: NodeJS.Timeout | null = null;

// Debounced search function that shows loading state immediately
export function debouncedSearchComics(props: SearchProps, dispatch: Dispatch, debounceMs: number = 300) {
  const { isLoadingMore = false, page = 1 } = props;
  
  // Dispatch loading state immediately
  dispatch(SEARCH.request({ page, isLoadingMore }));
  
  // Clear any existing timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  // Set a new timer for the actual API call
  searchDebounceTimer = setTimeout(() => {
    searchComics(props, dispatch);
  }, debounceMs);
}

export async function searchComics({ 
  publicClient, 
  term, 
  page = 1, 
  limitPerPage = 20, 
  filterForTypes = ["COMICSERIES"],
  filterForTags,
  filterForGenres,
  isLoadingMore = false,
  forceRefresh = false,
}: SearchProps, dispatch: Dispatch) {
  // We don't need to dispatch request here anymore since it's done in debouncedSearchComics
  // Only dispatch if this function is called directly
  if (!searchDebounceTimer) {
    dispatch(SEARCH.request({ page, isLoadingMore }));
  }

  // add a small delay to test the loading state
  // await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Execute the search query
    const searchResult = await publicClient.query<SearchQuery, SearchQueryVariables>({
      query: Search,
      variables: { 
        term,
        page,
        limitPerPage,
        filterForTypes,
        filterForTags,
        filterForGenres
      },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    if (!searchResult.data?.search) {
      throw new Error("Search data not found");
    }

    const parsedData = parseSearchResults(searchResult.data);

    dispatch(SEARCH.success(parsedData, { page }));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, SEARCH)(error);
  }
}

export function parseSearchResults(data: SearchQuery): SearchLoaderData {
  return {
    isSearchLoading: false,
    isLoadingMore: false,
    searchResults: data.search?.comicSeries?.filter(Boolean) as ComicSeries[] || [],
    searchId: data.search?.searchId || '',
  };
}

export type SearchLoaderData = {
  isSearchLoading: boolean;
  isLoadingMore: boolean;
  searchResults: ComicSeries[];
  searchId: string;
  apolloState?: Record<string, any>;
};

export const searchInitialState: SearchLoaderData = {
  isSearchLoading: false,
  isLoadingMore: false,
  searchResults: [],
  searchId: '',
}

/* Reducers */
export function searchQueryReducerDefault(state = searchInitialState, action: Action): SearchLoaderData {
  switch (action.type) {
    case SEARCH.REQUEST:

    const isLoadingMore = !!action.payload?.isLoadingMore;

    return {
      ...state,
      isSearchLoading: !isLoadingMore,
      isLoadingMore: isLoadingMore,
    };
      
    case SEARCH.SUCCESS:
      const isPaginationRequest = action.meta?.page && action.meta.page > 1;

      console.log('action.payload', action.payload);

      // For pagination, append new results to existing ones
      if (isPaginationRequest) {
        return {
          ...state,
          ...action.payload,
          searchResults: mergeItemsWithUuid(state.searchResults, action.payload.searchResults),
          isSearchLoading: false,
          isLoadingMore: false,
        };
      } 
      
      // For new searches, replace the results
      return {
        ...state,
        ...action.payload,
        isSearchLoading: false,
        isLoadingMore: false,
      };
      
    case SEARCH.FAILURE:
      return {
        ...state,
        isSearchLoading: false,
        isLoadingMore: false,
      };
      
    default:
      return state;
  }
}

export const searchQueryReducer = (state: SearchLoaderData, action: Action) => searchQueryReducerDefault(state, action); 