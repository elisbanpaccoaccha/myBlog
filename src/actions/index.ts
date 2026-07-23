import { authActions } from './auth';
import { postActions } from './posts';
import { profileActions } from './profile';
import { toolsActions } from './tools';
import { interactionActions } from './interactions';

export const server = {
  ...authActions,
  ...postActions,
  ...profileActions,
  ...toolsActions,
  ...interactionActions,
};