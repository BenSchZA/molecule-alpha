/**
 *
 * PortfolioContainer
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { compose, Dispatch } from 'redux';
import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import reducer from './reducer';
import saga from './saga';
import { ApplicationRootState } from 'types';
import BackedProjectsGrid from 'components/BackedProjectsGrid';
import { RESTART_ON_REMOUNT } from 'utils/constants';
import { Project } from 'domain/projects/types';
import selectPortfolioContainer from './selectors';

interface OwnProps {
}

interface DispatchProps {
}

export interface StateProps {
  projects: Array<Project>,
  userAddress: string,
}

type Props = StateProps  & OwnProps & DispatchProps;

const PortfolioContainer: React.FunctionComponent<Props> = ({userAddress, projects}: Props) => (
  <BackedProjectsGrid projects={projects} userAddress={userAddress} />
)

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => ({
  dispatch: dispatch,
});

const mapStateToProps = (state: ApplicationRootState) => selectPortfolioContainer(state);

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps
);

const withReducer = injectReducer<OwnProps>({
  key: 'portfolioContainer',
  reducer: reducer,
});
const withSaga = injectSaga<OwnProps>({
  key: 'portfolioContainer',
  saga: saga,
  mode: RESTART_ON_REMOUNT
});

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(PortfolioContainer);
