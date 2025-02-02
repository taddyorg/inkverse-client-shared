import type { ApolloClient, ApolloQueryResult } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action } from './utils';
import { type GetComicSeriesQuery, type GetComicSeriesQueryVariables, SortOrder, GetComicSeries, ComicIssue, ComicSeries } from "@/shared/graphql/operations";

/* Actions */
export const GET_COMICSERIES = asyncAction(ActionTypes.GET_COMICSERIES);

/* Action Creators */
interface GetComicSeriesProps {
  publicClient: ApolloClient<any>;
  uuid: string;
  forceRefresh?: boolean;
}

export async function loadComicSeries({ publicClient, uuid, forceRefresh = false }: GetComicSeriesProps, dispatch: Dispatch) {
  dispatch(GET_COMICSERIES.request());

  try {
    // Then get the full comic series data
    const comicSeriesResult = await publicClient.query<GetComicSeriesQuery, GetComicSeriesQueryVariables>({
      query: GetComicSeries,
      variables: { 
        uuid,
        sortOrderForIssues: SortOrder.OLDEST,
        limitPerPageForIssues: 1000,
        pageForIssues: 1
      },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    if (!comicSeriesResult.data?.getComicSeries) {
      throw new Error("Comic series data not found");
    }

    const parsedData = parseLoaderComicSeries(comicSeriesResult.data);

    dispatch(GET_COMICSERIES.success(parsedData));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, GET_COMICSERIES)(error);
  }
}

export function parseLoaderComicSeries(data: GetComicSeriesQuery): ComicSeriesLoaderData {
  return {
    isComicSeriesLoading: false,
    comicseries: data.getComicSeries || null,
    issues: data.getIssuesForComicSeries?.issues?.filter(
      (issue: ComicIssue | null): issue is ComicIssue => issue !== null
    ) || [],
  };
}

export type ComicSeriesLoaderData = {
  isComicSeriesLoading: boolean;
  comicseries: ComicSeries | null;
  issues: ComicIssue[];
  apolloState?: Record<string, any>;
};

export const comicSeriesInitialState: ComicSeriesLoaderData = {
  isComicSeriesLoading: false,
  comicseries: null,
  issues: [],
}

/* Reducers */
export function comicSeriesQueryReducerDefault(state = comicSeriesInitialState, action: Action): ComicSeriesLoaderData {
  switch (action.type) {
    case GET_COMICSERIES.REQUEST:
      return {
        ...state,
        isComicSeriesLoading: true,
      };
    case GET_COMICSERIES.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isComicSeriesLoading: false,
      };
    default:
      return state;
  }
}

export const comicSeriesQueryReducer = (state: ComicSeriesLoaderData, action: Action) => comicSeriesQueryReducerDefault(state, action); 