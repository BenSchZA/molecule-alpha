/**
 *
 * UserManagement
 *
 */

import React, { Fragment } from 'react';
import { colors } from 'theme';
import { Theme, createStyles, withStyles, WithStyles, Typography, TableHead, Table, TableCell, TableBody, TableRow, Button, Paper } from '@material-ui/core';
import dayjs from 'dayjs'
import { forwardTo } from 'utils/history';

const styles = (theme: Theme) =>
  createStyles({
    banner: {
      marginBottom: '16px',
      backgroundColor: colors.lightGrey,
      width: '100%'
    },
    maxWidth: {
      width: '1200px!important'
    },
    actionButton: {
      marginTop: '12px',
      marginBottom: '12px'
    },
    emptyRow: {
      height: '71px',
    }
  });

interface OwnProps extends WithStyles<typeof styles> {
  users: Array<{
    id: string,
    ethAddress: string,
    type: any,
    createdAt: Date,
  }>
}

const UserManagement: React.FunctionComponent<OwnProps> = (props: OwnProps) => (
  <Fragment>
    <Paper className={props.classes.banner} elevation={0}>
      <Typography variant='h5'>User Management</Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User Address</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Type</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.users && props.users.length > 0 ? props.users.map(ca => (
              <TableRow key={ca.id}>
                <TableCell>{ca.ethAddress.toUpperCase()}</TableCell>
                <TableCell>{dayjs(ca.createdAt).format('YYYY-MM-DD HH:mm')}</TableCell>
                <TableCell>{ca.type == 0 ? 'Standard' : (ca.type == 2 ? 'Admin' : 'Creator')}</TableCell>
                <TableCell>
                  <Button className={props.classes.actionButton} onClick={() => forwardTo(`/admin/user/${ca.id}`)}>Details</Button>
                </TableCell>
              </TableRow>
            )) :
              <TableRow className={props.classes.emptyRow}>
                <TableCell>No users</TableCell>
              </TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Paper>
  </Fragment>


);


export default withStyles(styles, { withTheme: true })(UserManagement);
