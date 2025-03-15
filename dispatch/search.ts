import type { ApolloClient } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action } from './utils';
import { type SearchQuery, type SearchQueryVariables, Search } from "@/shared/graphql/operations";
import type { ComicSeries, Genre } from "@/shared/graphql/types";

/* Actions */
export const SEARCH = asyncAction(ActionTypes.SEARCH);

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
  dispatch(SEARCH.request({ page, isLoadingMore }));

  //add a small delay to prevent rapid consecutive requests
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
      return {
        ...state,
        isSearchLoading: true,
        isLoadingMore: action.payload?.isLoadingMore || false,
      };
      
    case SEARCH.SUCCESS:
      const isPaginationRequest = action.meta?.page && action.meta.page > 1;

      if (isPaginationRequest) {
        // For pagination, append new results to existing ones
        return {
          ...state,
          ...action.payload,
          searchResults: mergeSearchResults(state.searchResults, action.payload.searchResults),
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

// Helper function to merge search results while avoiding duplicates
function mergeSearchResults(existingResults: ComicSeries[], newResults: ComicSeries[]): ComicSeries[] {
  const existingUuids = new Set(existingResults.map(item => item.uuid));
  const uniqueNewResults = newResults.filter(item => !existingUuids.has(item.uuid));
  return [...existingResults, ...uniqueNewResults];
}

export const searchQueryReducer = (state: SearchLoaderData, action: Action) => searchQueryReducerDefault(state, action); 