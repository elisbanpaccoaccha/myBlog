import { authActions } from './auth';
import { postActions } from './posts';
import { profileActions } from './profile';
import { toolsActions } from './tools';

export const server = {
  ...authActions,
  ...postActions,
  ...profileActions,
  ...toolsActions,
};