import { createStandardAction } from "typesafe-actions";
import ActionTypes from "containers/AdminDashboardContainer/constants";

export const setCreatorsAwaitingApproval = createStandardAction(ActionTypes.SET_CREATORS_AWAITING_APPROVAL)<any>();