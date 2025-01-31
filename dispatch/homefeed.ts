import gql from 'graphql-tag';

import { asyncAction, ActionTypes, errorHandlerFactory, Dispatch, Action } from './utils';
import { publicClient } from '../../lib/apollo';
import { HomeScreen, type ComicSeries, type HomeScreenQuery, type List } from "@/shared/graphql/operations";

/* Actions */
export const GET_HOMESCREEN = asyncAction(ActionTypes.GET_HOMEFEED);

/* Action Creators */
interface GetHomeScreenProps {
  forceRefresh?: boolean;
}

export function loadHomeScreen({ forceRefresh = false }: GetHomeScreenProps, dispatch: Dispatch) {
  dispatch(GET_HOMESCREEN.request());

  return publicClient
    .query({
      query: HomeScreen,
      ...(!!forceRefresh && { fetchPolicy: 'network-only' })
    })
    .then((result) => {
      if (!result.data) {
        throw new Error('No data returned from HomeScreen query');
      }

      const data = {
        featuredComicSeries: selectRandomFeaturedSeries(result.data.getFeaturedComicSeries?.comicSeries),
        curatedLists: result.data.getCuratedLists?.lists?.filter(Boolean) || [],
        mostPopularComicSeries: shuffleAndLimitMostPopular(result.data.getMostPopularComicSeries?.comicSeries),
        recentlyAddedComicSeries: result.data.getRecentlyAddedComicSeries?.comicSeries?.filter(Boolean) || [],
        recentlyUpdatedComicSeries: result.data.getRecentlyUpdatedComicSeries?.comicSeries?.filter(Boolean) || [],
      };

      dispatch(GET_HOMESCREEN.success(data));
    })
    .catch(errorHandlerFactory(dispatch, GET_HOMESCREEN));
}

/* Helper Functions */
function selectRandomFeaturedSeries(series: ComicSeries[] | null | undefined) {
  if (!series?.length) return [];
  const randomIndex = Math.floor(Math.random() * series.length);
  return [series[randomIndex]];
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