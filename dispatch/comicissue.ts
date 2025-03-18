import type { ApolloClient } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action } from './utils.ts';
import { type GetComicIssueQuery, type GetComicIssueQueryVariables, SortOrder, GetComicIssue, type ComicIssue, type ComicSeries } from "@/shared/graphql/operations.ts";

/* Actions */
export const GET_COMICISSUE = asyncAction(ActionTypes.GET_COMICISSUE);

/* Action Creators */
interface GetComicIssueProps {
  publicClient: ApolloClient<any>;
  issueUuid: string;
  seriesUuid: string;
  forceRefresh?: boolean;
}

export async function loadComicIssue({ publicClient, issueUuid, seriesUuid, forceRefresh = false }: GetComicIssueProps, dispatch: Dispatch) {
  dispatch(GET_COMICISSUE.request());

  try {
    const comicIssueResult = await publicClient.query<GetComicIssueQuery, GetComicIssueQueryVariables>({
      query: GetComicIssue,
      variables: { 
        issueUuid,
        seriesUuid,
        sortOrderForIssues: SortOrder.OLDEST,
        limitPerPageForIssues: 1000,
        pageForIssues: 1
      },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    if (!comicIssueResult.data?.getComicIssue) {
      throw new Error("Comic issue data not found");
    }

    const parsedData = parseLoaderComicIssue(comicIssueResult.data);

    dispatch(GET_COMICISSUE.success(parsedData));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, GET_COMICISSUE)(error);
  }
}

export function parseLoaderComicIssue(data: GetComicIssueQuery): ComicIssueLoaderData {
  return {
    isComicIssueLoading: false,
    comicissue: data.getComicIssue || null,
    comicseries: data.getComicSeries || null,
    allIssues: data.getIssuesForComicSeries?.issues?.filter(
      (issue: ComicIssue | null): issue is ComicIssue => issue !== null
    ) || [],
  };
}

export type ComicIssueLoaderData = {
  isComicIssueLoading: boolean;
  comicissue: ComicIssue | null;
  comicseries: ComicSeries | null;
  allIssues: ComicIssue[];
  apolloState?: Record<string, any>;
};

export const comicIssueInitialState: ComicIssueLoaderData = {
  isComicIssueLoading: false,
  comicissue: null,
  comicseries: null,
  allIssues: [],
}

/* Reducers */
export function comicIssueQueryReducerDefault(state = comicIssueInitialState, action: Action): ComicIssueLoaderData {
  switch (action.type) {
    case GET_COMICISSUE.REQUEST:
      return {
        ...state,
        isComicIssueLoading: true,
      };
    case GET_COMICISSUE.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isComicIssueLoading: false,
      };
    default:
      return state;
  }
}

export const comicIssueQueryReducer = (state: ComicIssueLoaderData, action: Action) => comicIssueQueryReducerDefault(state, action); 