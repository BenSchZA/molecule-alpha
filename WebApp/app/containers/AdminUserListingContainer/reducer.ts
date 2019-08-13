/*
 *
 * AdminDashboardContainer reducer
 *
 */

import { ContainerState, ContainerActions } from './types';
import * as actions from './actions';
import { getType } from 'typesafe-actions';

export const initialState: ContainerState = {
  creatorsAwaitingApproval: [],
  users: []
};

function AdminUserListingContainer(state: ContainerState = initialState, action: ContainerActions) {
  switch (action.type) {
    case getType(actions.setCreatorsAwaitingApproval):
      return {
        ...state,
        creatorsAwaitingApproval: action.payload.creators,
      }
    case getType(actions.setAllUsers):
      return {
        ...state,
        users: action.payload.users,
      }
    default:
      return state;
  }
}

export default AdminUserListingContainer;
