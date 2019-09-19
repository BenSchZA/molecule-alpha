/* eslint-disable react/prop-types */
import { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withSnackbar, OptionsObject } from 'notistack';
import { removeSnackbar } from './actions';

interface OwnProps {

}

interface StateProps {
  notifications: any[],
}

interface DispatchProps {
  closeSnackbar(key: number): void;
  removeSnackbar(key: number): void;
  enqueueSnackbar(message: string, options?: OptionsObject | undefined): string | number | null | undefined
}


type Props = OwnProps & StateProps & DispatchProps;

class Notifier extends Component<Props> {
  displayed: any[] = [];

  storeDisplayed = (id) => {
    this.displayed = [...this.displayed, id];
  };

  shouldComponentUpdate({ notifications: newSnacks }) {
    if (!newSnacks.length) {
      this.displayed = [];
      return false;
    }

    const { notifications: currentSnacks } = this.props;
    let notExists = false;
    for (let i = 0; i < newSnacks.length; i += 1) {
      const newSnack = newSnacks[i];
      if (newSnack.dismissed) {
        this.props.closeSnackbar(newSnack.key);
        this.props.removeSnackbar(newSnack.key);
      }

      if (notExists) continue;
      notExists = notExists || !currentSnacks.filter(({ key }) => newSnack.key === key).length;
    }
    return notExists;
  }

  componentDidUpdate() {
    const { notifications = [] } = this.props;

    notifications.forEach(({ key, message, options = {} }) => {
      // Do nothing if snackbar is already displayed
      if (this.displayed.includes(key)) return;
      // Display snackbar using notistack
      this.props.enqueueSnackbar(message, {
        ...options,
        onClose: (event, reason, key) => {
          if (options.onClose) {
            options.onClose(event, reason, key);
          }
          // Dispatch action to remove snackbar from redux store
          this.props.removeSnackbar(key);
        }
      });
      // Keep track of snackbars that we've displayed
      this.storeDisplayed(key);
    });
  }

  render() {
    console.log('in render');
    return null;
  }
}

const mapStateToProps = state => {
  console.log('in map state to props');
  console.log(state.notification);
  return {
    notifications: state.notification.notifications,
  }
};

const mapDispatchToProps = dispatch => bindActionCreators({ removeSnackbar }, dispatch);

export default withSnackbar(connect(
  mapStateToProps,
  mapDispatchToProps,
)(Notifier));