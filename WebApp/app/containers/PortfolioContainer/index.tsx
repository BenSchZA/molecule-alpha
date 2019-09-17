/**
 *
 * PortfolioContainer
 *
 */

import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { compose, Dispatch } from 'redux';
import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import reducer from './reducer';
import saga from './saga';
import selectPortfolioContainer from './selectors';
import { ApplicationRootState } from 'types';
import ProjectSearch from 'components/ProjectSearch';
import BackedProjectsGrid from 'components/BackedProjectsGrid';
import { RESTART_ON_REMOUNT } from 'utils/constants';
import { setFilter } from './actions';
import { Project } from 'domain/projects/types';

interface OwnProps {}

interface DispatchProps {
  setFilter: (filter) => void
}

export interface StateProps {
  filter: {
    text: string,
    projectStatus: number,
  }
  projects: Array<Project>
}

type Props = StateProps & DispatchProps & OwnProps;

const DiscoverContainer: React.FunctionComponent<Props> = ({filter, setFilter, projects}: Props) => (
  <Fragment>
    <ProjectSearch setFilter={setFilter} filter={filter} />
    <BackedProjectsGrid projects={projects} />
  </Fragment>
)

const mapStateToProps = (state: ApplicationRootState) => selectPortfolioContainer(state);

function mapDispatchToProps(dispatch: Dispatch): DispatchProps {
  return {
    setFilter: (filter) => dispatch(setFilter(filter)),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

const withReducer = injectReducer<OwnProps>({
  key: 'backedProjects',
  reducer: reducer,
});
const withSaga = injectSaga<OwnProps>({
  key: 'backedProjects',
  saga: saga,
  mode: RESTART_ON_REMOUNT
});

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(DiscoverContainer);
