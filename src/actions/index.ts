import { authActions } from './auth';
import { postActions } from './posts';
import { profileActions } from './profile';

export const server = {
  ...authActions,
  ...postActions,
  ...profileActions,
};