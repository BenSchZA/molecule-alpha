// import { ContainerState, ContainerActions } from './types';
import { getType } from 'typesafe-actions';
import * as authenticationActions from './actions';
import { DomainActions, DomainState } from './types';

export const initialState: DomainState = {
  walletUnlocked: false,
  userId: '',
  ethAddress: '',
  daiBalance: 0,
  selectedNetworkId: undefined,
  signedPermit: '',
  accessToken: '',
  errorMessage: '',
  userRole: 0,
};

function authenticationReducer(state: DomainState = initialState, action: DomainActions) {
  switch (action.type) {
    case getType(authenticationActions.saveAccessPermit):
      return { ...state, ...{ signedPermit: action.payload } };
    case getType(authenticationActions.saveAccessToken):
      return {
        ...state,
        ...{ accessToken: action.payload },
      };
    case getType(authenticationActions.connectWallet.success):
      return {
        ...state,
        ...{ errorMessage: '' },
        ...{ walletUnlocked: true },
      };
    case getType(authenticationActions.connectWallet.failure):
      return {
        ...state,
        ...{ errorMessage: action.payload },
        ...{ walletUnlocked: false },
      };
    case getType(authenticationActions.logOut):
      return {
        ...initialState,
        ...{ walletUnlocked: state.walletUnlocked },
      };
    case getType(authenticationActions.authenticate.failure):
      return {
        ...state,
        ...{ errorMessage: action.payload },
      };
    case getType(authenticationActions.setEthAddress):
      return {
        ...state,
        ...{ ethAddress: action.payload }
      }
    case getType(authenticationActions.setDaiBalance):
      return {
        ...state,
        ...{ daiBalance: action.payload }
      }
    case getType(authenticationActions.setUserRole):
      return {
        ...state,
        ...{ userRole: action.payload }
      }
    case getType(authenticationActions.setUserId):
      return {
        ...state,
        ...{ userId: action.payload }
      }
    default:
      return state;
  }
}

export default authenticationReducer;
