import type { User, Post } from '../types/index';

/** Static test fixtures used across UI and API tests. */
export const testUsers: Partial<User>[] = [
  {
    id: 1,
    name: 'Leanne Graham',
    username: 'Bret',
    email: 'Sincere@april.biz',
  },
  {
    id: 2,
    name: 'Ervin Howell',
    username: 'Antonette',
    email: 'Shanna@melissa.tv',
  },
];

export const testPosts: Partial<Post>[] = [
  {
    userId: 1,
    title: 'Sample Post Title',
    body: 'Sample post body content used in API tests.',
  },
];

export const loginCredentials = {
  valid: {
    username: process.env.TEST_USERNAME ?? 'standard_user',
    password: process.env.TEST_PASSWORD ?? 'secret_sauce',
  },
  invalid: {
    username: 'locked_out_user',
    password: 'secret_sauce',
  },
};
