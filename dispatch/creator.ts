import { ApolloClient } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action } from './utils.ts';
import { GetCreator, type GetCreatorQuery, type Creator, type ComicSeries } from '@/shared/graphql/operations.ts';

/* Actions */
export const GET_CREATOR = asyncAction(ActionTypes.GET_CREATOR);

/* Types */
export type CreatorLoaderData = {
  isLoading: boolean;
  creator: Creator | null;
  comicseries: ComicSeries[] | null;
};

export const creatorInitialState: CreatorLoaderData = {
  isLoading: false,
  creator: null,
  comicseries: null,
};

/* Action Creators */
interface GetCreatorScreenProps {
  publicClient: ApolloClient<any>;
  uuid: string;
  forceRefresh?: boolean;
}

export async function getCreatorScreen({ publicClient, uuid, forceRefresh = false }: GetCreatorScreenProps, dispatch: Dispatch) {
  dispatch(GET_CREATOR.request());

  try {
    // Get full creator data
    const creatorResult = await publicClient.query<GetCreatorQuery>({
      query: GetCreator,
      variables: { uuid },
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    });

    if (!creatorResult.data?.getCreator) {
      throw new Error('Creator not found');
    }

    const parsedData = parseLoaderCreator(creatorResult.data);
    dispatch(GET_CREATOR.success(parsedData));
  } catch (error: Error | unknown) {
    errorHandlerFactory(dispatch, GET_CREATOR)(error);
  }
}

export function parseLoaderCreator(data: GetCreatorQuery): CreatorLoaderData {
  return {
    isLoading: false,
    creator: data.getCreator || null,
    comicseries: data.getCreator?.comics?.filter((comic): comic is ComicSeries => comic !== null) || null,
  };
}

/* Reducers */
export function creatorQueryReducerDefault(state = creatorInitialState, action: Action): CreatorLoaderData {
  switch (action.type) {
    case GET_CREATOR.REQUEST:
      return {
        ...state,
        isLoading: true,
      };
    case GET_CREATOR.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
}

export const creatorQueryReducer = (state: CreatorLoaderData, action: Action) => creatorQueryReducerDefault(state, action);