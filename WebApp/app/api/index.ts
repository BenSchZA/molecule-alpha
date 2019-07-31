import apiRequest from './apiRequest';
import apiUrlBuilder from './apiUrlBuilder';
import formDataHelper from './formDataHelper';
import { CreatorApplicationData } from 'containers/CreatorApplicationContainer/types';

export function login(signedPermit: string, ethAddress: string): Promise<any> {
  const body = JSON.stringify({ signedPermit: signedPermit, ethAddress: ethAddress});
  return apiRequest('POST', apiUrlBuilder.login, body, 'application/json');
}

export function getPermit(ethAddress: string): Promise<any>  {
  const body = JSON.stringify({ ethAddress: ethAddress });
  return apiRequest('POST', apiUrlBuilder.getPermit, body, 'application/json');
}

export async function submitCreatorApplication(creatorApplicationData: CreatorApplicationData, apiToken: string) {
  const requestData = formDataHelper(creatorApplicationData);
  return apiRequest(
    'POST',
    apiUrlBuilder.submitCreatorApplication,
    requestData,
    undefined, // The Content-Type header is set automatically via the FormData object.
    true,
    apiToken);
}

export async function getCreatorApplication(apiToken: string) {
  return apiRequest('GET', apiUrlBuilder.getCreatorApplication, undefined, 'application/json', true, apiToken)
}

export async function verifyEmail(token: string, apiToken: string) {
  const body = JSON.stringify({token: token});
  return apiRequest('POST', apiUrlBuilder.verifyEmail, body, 'application/json', true, apiToken);
}