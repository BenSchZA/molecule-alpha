/**
 *
 * AdminDashboardContainer
 *
 */

import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { compose, Dispatch } from 'redux';

// import injectSaga from 'utils/injectSaga';
// import injectReducer from 'utils/injectReducer';
// import reducer from './reducer';
// import saga from './saga';
import makeSelectAdminDashboardContainer from './selectors';

interface OwnProps {}

interface DispatchProps {}

interface StateProps {}

type Props = StateProps & DispatchProps & OwnProps;

const AdminDashboardContainer: React.SFC<Props> = (props: Props) => {
  return <Fragment>AdminDashboardContainer</Fragment>;
};

const mapStateToProps = createStructuredSelector({
  adminDashboardContainer: makeSelectAdminDashboardContainer(),
});

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => {
  return {
    dispatch: dispatch,
  };
};

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

// Remember to add the key to ./app/types/index.d.ts ApplicationRootState
// <OwnProps> restricts access to the HOC's other props. This component must not do anything with reducer hoc
// const withReducer = injectReducer<OwnProps>({
//   key: 'adminDashboardContainer',
//   reducer: reducer,
// });
// // <OwnProps> restricts access to the HOC's other props. This component must not do anything with saga hoc
// const withSaga = injectSaga<OwnProps>({
//   key: 'adminDashboardContainer',
//   saga: saga,
// });

export default compose(
  // withReducer,
  // withSaga,
  withConnect,
)(AdminDashboardContainer);
