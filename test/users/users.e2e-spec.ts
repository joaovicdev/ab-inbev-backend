import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { IUser } from '../../src/interfaces';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let createdUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET) should return an array of users', async () => {
    const res = await request(app.getHttpServer()).get('/users').expect(200);
    const users: IUser[] = res.body as IUser[];
    expect(Array.isArray(users)).toBe(true);
  });

  it('/users (POST) should create a user', async () => {
    const newUser: Partial<IUser> = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
    };

    const res = await request(app.getHttpServer())
      .post('/users')
      .send(newUser)
      .expect(201);

    const user: IUser = res.body as IUser;

    expect(user).toHaveProperty('id');
    expect(user.name).toBe(newUser.name);
    expect(user.email).toBe(newUser.email);
    createdUserId = user.id;
  });

  it('/users/:id (GET) should return a single user by ID', async () => {
    const userToCreate: Partial<IUser> = {
      name: 'GetOne User',
      email: `getone-${Date.now()}@example.com`,
    };

    const createRes = await request(app.getHttpServer())
      .post('/users')
      .send(userToCreate)
      .expect(201);

    const createdUser: IUser = createRes.body as IUser;

    const res = await request(app.getHttpServer())
      .get(`/users/${createdUser.id}`)
      .expect(200);

    const user: IUser = res.body as IUser;

    expect(user.id).toBe(createdUser.id);
    expect(user.name).toBe(userToCreate.name);
  });

  it('/users/:id (DELETE) - should remove the user', async () => {
    await request(app.getHttpServer())
      .delete(`/users/${createdUserId}`)
      .expect(200);

    const res = await request(app.getHttpServer()).get(
      `/users/${createdUserId}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });
});
