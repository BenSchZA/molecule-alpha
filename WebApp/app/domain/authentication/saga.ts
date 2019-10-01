import jwtDecode from 'jwt-decode';
import { eventChannel } from 'redux-saga';
import { call, cancel, delay, fork, put, race, select, take } from 'redux-saga/effects';
import { ApplicationRootState } from 'types';
import { forwardTo } from 'utils/history';
import { getPermit as getPermitApi, login } from '../../api';
import * as authenticationActions from './actions';
import ActionTypes from './constants';
import { getBlockchainObjects, signMessage, BlockchainResources } from 'blockchainResources';
import { getType } from 'typesafe-actions';
import { getDaiBalance, getDaiContract } from './chain';


export function* getPermit() {
  const { signerAddress } = yield call(getBlockchainObjects)
  try {
    const { data } = yield call(getPermitApi, signerAddress);
    const signedPermit = yield call(signMessage, data.permit);
    yield put(authenticationActions.saveAccessPermit(signedPermit));
    return signedPermit;
  } catch (error) {
    console.error(error);
  }
}

export function* getAccessToken(signedPermit, ethAddress) {
  try {
    const apiToken = yield call(login, signedPermit, ethAddress);
    yield put(authenticationActions.saveAccessToken(apiToken.data.accessToken));
    yield put(authenticationActions.setUserId(apiToken.data.userId))
    const decodedToken = yield call(jwtDecode, apiToken.data.accessToken);
    yield put(authenticationActions.setUserRole(decodedToken.type))
    return apiToken.data;
  } catch (error) {
    if (error.message.includes('Authentication Error')) {
      yield put(authenticationActions.logOut());
      yield put(authenticationActions.authenticate.failure('Looks like something went wrong. Please sign another message'));
    } else {
      yield put(authenticationActions.authenticate.failure('The server did not respond. Try again.'));
    }
  }
}

export function* refreshTokenPoller() {
  while (true) {
    const signedMessage = yield select((state: ApplicationRootState) => state.authentication.signedPermit);
    const apiToken = yield select((state: ApplicationRootState) => state.authentication.accessToken);

    const { signerAddress } = yield call(getBlockchainObjects);

    let delayDuration;
    let decodedToken;
    try {
      decodedToken = yield call(jwtDecode, apiToken);
    } catch (error) {
      const newToken = yield call(getAccessToken, signedMessage, signerAddress);
      decodedToken = yield call(jwtDecode, newToken);
    }

    delayDuration = (decodedToken.exp - Date.now() / 1000) * 0.9;
    if ((Date.now() / 1000) + (delayDuration + 1) > decodedToken.exp) {
      yield call(getAccessToken, signedMessage, signerAddress);
    } else {
      yield delay(delayDuration * 1000);
    }
  }
}

export function* loginFlow() {
  while (yield take(getType(authenticationActions.authenticate.request))) {

    try {
      const response = yield call(getPermit);
      const { signerAddress } = yield call(getBlockchainObjects);

      yield call(getAccessToken, response, signerAddress);
      // yield put(userProfileActions.getUserProfile.request());
      yield fork(refreshTokenPoller);
      yield call(forwardTo, '/discover'); // TODO: have this only redirect when on log in
    } catch (error) {
      yield put(authenticationActions.authenticate.failure(error.message));
      console.error(error);
    }
  }
}

export function* connectWallet() {
  try {
    const { signerAddress, provider, networkId, approvedNetwork, approvedNetworkName }: BlockchainResources = yield call(getBlockchainObjects);
    if (provider) {
      yield put(authenticationActions.connectWallet.success({
        approvedNetwork: approvedNetwork,
        ethAddress: signerAddress,
        networkId: networkId,
        approvedNetworkName: approvedNetworkName,
      }));
    } else {
      yield put(authenticationActions.connectWallet.failure('Non-Ethereum browser detected. You should consider trying MetaMask!'));
    }
  } catch (error) {
    yield put(authenticationActions.connectWallet.failure(error.message));
  }
}

// Exported for testing purposes
export const addressChangeEventChannel = eventChannel(emit => {
  try {
    const { ethereum } = window as any;
    ethereum.on('accountsChanged', (accounts) => {
      emit(accounts);
    });
  }
  catch (e) {
    console.log(e)
  }
  return () => { };
});

export function* addressChangeListener() {
  while (true) {
    const newAddress = yield take(addressChangeEventChannel);
    yield put(authenticationActions.logOut());
    yield put(authenticationActions.setEthAddress(newAddress[0]));
    yield fork(connectWallet);
  }
}

export function* daiBalanceListener() {
  const { signerAddress } = yield call(getBlockchainObjects);
  const daiContract = yield call(getDaiContract);
  
  // event Transfer(
  //     address indexed from,
  //     address indexed to,
  //     uint256 value
  // );
  // The null field indicates any value matches, this specifies
  // "any Transfer from any to signerAddress"
  const filterTo = daiContract.filters.Transfer(null, signerAddress, null);
  const filterFrom = daiContract.filters.Transfer(signerAddress, null, null);

  daiContract.removeAllListeners(filterTo);
  daiContract.removeAllListeners(filterFrom);

  const transferEventChannel = eventChannel(emit => {
    try {
      // Listen for filtered results
      daiContract.on(filterTo, (from, to, value) => {
        console.log('Received ' + value.toString() + ' Dai from ' + from);
        emit(value);
      });
      daiContract.on(filterFrom, (from, to, value) => {
        console.log('Sent ' + value.toString() + ' Dai to ' + to);
        emit(value);
      });
    }
    catch (e) {
      console.log(e);
    }
    return () => { };
  });

  while (true) {
    const daiBalance = yield call(getDaiBalance);
    yield put(authenticationActions.setDaiBalance(daiBalance));
    yield take(transferEventChannel);
  }
}

export default function* rootAuthenticationSaga() {
  while (true) {
    // Start a task to unlock the wallet.
    const connectWalletTask = yield fork(connectWallet);

    // Wait till a response comes back a response on the wallet.
    const { success } = yield race({
      cancel: take(ActionTypes.CONNECT_WALLET_FAILURE),
      success: take(ActionTypes.CONNECT_WALLET_SUCCESS),
    });

    if (success) {
      // Cancel the task that we started
      yield cancel(connectWalletTask);

      // Start the addressChange listener
      yield fork(addressChangeListener);
      // Start the Dai balance listener
      yield fork(daiBalanceListener);

      // Check store for existing signed message
      const signedMessage = yield select((state: ApplicationRootState) => state.authentication.signedPermit);

      let watcher;
      if (!signedMessage) {
        // Start the login listener
        watcher = yield fork(loginFlow);
      } else {
        // Start the refresh token listener
        watcher = yield fork(refreshTokenPoller);
      }

      // Wait till we receive a logout event
      yield take(ActionTypes.LOG_OUT);
      yield cancel(watcher);
    } else {
      yield delay(2000);
    }
  }
}
