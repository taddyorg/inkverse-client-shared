import type { ApolloClient, ApolloQueryResult } from '@apollo/client';
import { asyncAction, ActionTypes, errorHandlerFactory, type Dispatch, type Action } from './utils';
import { HomeScreen, type ComicSeries, type HomeScreenQuery, type List } from "@/shared/graphql/operations";

/* Actions */
export const GET_HOMESCREEN = asyncAction(ActionTypes.GET_HOMEFEED);

/* Action Creators */
interface GetHomeScreenProps {
  publicClient: ApolloClient<any>;
  forceRefresh?: boolean;
}

export function loadHomeScreen({ publicClient, forceRefresh = false }: GetHomeScreenProps, dispatch: Dispatch) {
  dispatch(GET_HOMESCREEN.request());

  return publicClient.query<HomeScreenQuery>({
      query: HomeScreen,
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    }).then((result: ApolloQueryResult<HomeScreenQuery>) => {
      const data = parseLoaderHomeScreen(result?.data);
      dispatch(GET_HOMESCREEN.success(data));
    })
    .catch(errorHandlerFactory(dispatch, GET_HOMESCREEN));
}

export type HomeScreenLoaderData = {
  featuredComicSeries: ComicSeries[] | null | undefined;
  curatedLists: List[] | null | undefined;
  mostPopularComicSeries: ComicSeries[] | null | undefined;
  recentlyAddedComicSeries: ComicSeries[] | null | undefined;
  recentlyUpdatedComicSeries: ComicSeries[] | null | undefined;
  apolloState?: Record<string, any>;
};

export function parseLoaderHomeScreen(data: HomeScreenQuery): HomeScreenLoaderData {
  const featuredSeries = data.getFeaturedComicSeries?.comicSeries?.filter(
    (series): series is ComicSeries => series !== null
  );

  const randomFeaturedSeries = featuredSeries?.length 
    ? [featuredSeries[Math.floor(Math.random() * featuredSeries.length)]]
    : [];

  const mostPopularSeries = data.getMostPopularComicSeries?.comicSeries?.filter(
    (series): series is ComicSeries => series !== null
  );

  return {
    featuredComicSeries: randomFeaturedSeries,
    curatedLists: data.getCuratedLists?.lists?.filter((list): list is List => list !== null) || [],
    mostPopularComicSeries: shuffleAndLimitMostPopular(mostPopularSeries),
    recentlyAddedComicSeries: data.getRecentlyAddedComicSeries?.comicSeries?.filter(
      (series): series is ComicSeries => series !== null) || [],
    recentlyUpdatedComicSeries: data.getRecentlyUpdatedComicSeries?.comicSeries?.filter(
      (series): series is ComicSeries => series !== null) || [],
  };
}

function shuffleAndLimitMostPopular(series: ComicSeries[] | null | undefined, limit = 6) {
  if (!series?.length) return [];
  return [...series]
    .filter(Boolean)
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

/* Reducers */
export function homefeedQueryReducerDefault(state = {}, action: Action) {
  switch (action.type) {
    case GET_HOMESCREEN.REQUEST:
      return {
        ...state,
        isHomeScreenLoading: true,
      };
    case GET_HOMESCREEN.SUCCESS:
      return {
        ...state,
        ...action.payload,
        isHomeScreenLoading: false,
      };
    default:
      return state;
  }
}

export const homefeedQueryReducer = (state: any, action: Action) => homefeedQueryReducerDefault(state, action);