import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

const validPlayers = [
  { apiPlayerId: 1, name: 'GK One', position: 'GK', isCaptain: false },
  { apiPlayerId: 2, name: 'DEF One', position: 'DEF', isCaptain: false },
  { apiPlayerId: 3, name: 'DEF Two', position: 'DEF', isCaptain: false },
  { apiPlayerId: 4, name: 'DEF Three', position: 'DEF', isCaptain: false },
  { apiPlayerId: 5, name: 'DEF Four', position: 'DEF', isCaptain: false },
  { apiPlayerId: 6, name: 'MID One', position: 'MID', isCaptain: false },
  { apiPlayerId: 7, name: 'MID Two', position: 'MID', isCaptain: false },
  { apiPlayerId: 8, name: 'MID Three', position: 'MID', isCaptain: false },
  { apiPlayerId: 9, name: 'MID Four', position: 'MID', isCaptain: false },
  { apiPlayerId: 10, name: 'FWD One', position: 'FWD', isCaptain: true },
  { apiPlayerId: 11, name: 'FWD Two', position: 'FWD', isCaptain: false },
];

async function registerAndLogin(email) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', displayName: 'Team Owner' });
  return res.body.accessToken;
}

describe('Team routes', () => {
  it('creates and lists teams for owner', async () => {
    const token = await registerAndLogin('team@example.com');

    const createRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Squad', formation: '4-4-2', players: validPlayers });

    expect(createRes.status).toBe(201);
    expect(createRes.body.team.name).toBe('My Squad');

    const listRes = await request(app)
      .get('/api/teams')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.teams).toHaveLength(1);
  });

  it('blocks access to another users team', async () => {
    const ownerToken = await registerAndLogin('owner@example.com');
    const otherToken = await registerAndLogin('other@example.com');

    const createRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Private Squad', formation: '4-4-2', players: validPlayers });

    const teamId = createRes.body.team._id;

    const getRes = await request(app)
      .get(`/api/teams/${teamId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(getRes.status).toBe(403);
  });
});
