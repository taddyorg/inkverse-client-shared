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
  forceRefresh = false 
}: SearchProps, dispatch: Dispatch) {
  dispatch(SEARCH.request());

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

    dispatch(SEARCH.success(parsedData));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, SEARCH)(error);
  }
}

export function parseSearchResults(data: SearchQuery): SearchLoaderData {
  return {
    isSearchLoading: false,
    searchResults: data.search?.comicSeries?.filter(Boolean) as ComicSeries[] || [],
    searchId: data.search?.searchId || '',
  };
}

export type SearchLoaderData = {
  isSearchLoading: boolean;
  searchResults: ComicSeries[];
  searchId: string;
  apolloState?: Record<string, any>;
};

export const searchInitialState: SearchLoaderData = {
  isSearchLoading: false,
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
      };
    case SEARCH.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isSearchLoading: false,
      };
    default:
      return state;
  }
}

export const searchQueryReducer = (state: SearchLoaderData, action: Action) => searchQueryReducerDefault(state, action); 