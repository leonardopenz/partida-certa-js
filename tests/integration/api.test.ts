import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import request from "supertest";

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !new URL(testUrl).pathname.endsWith("_test")) {
  throw new Error(
    "Defina TEST_DATABASE_URL para um banco dedicado cujo nome termine em _test.",
  );
}
process.env.DATABASE_URL = testUrl;
process.env.NODE_ENV = "test";
process.env.APP_URL = "http://localhost:5173";
const { app } = await import("../../src/server/app");
const { db } = await import("../../src/server/models/database");
const origin = process.env.APP_URL;

test("fluxo completo com isolamento entre grupos e concorrência de presença", async (t) => {
  const users: string[] = [];
  const groupIds: string[] = [];
  const owner = request.agent(app);
  const outsider = request.agent(app);
  const guest = request(app);
  try {
    const suffix = randomUUID();
    const ownerSignup = await owner
      .post("/api/auth/register")
      .set("Origin", origin)
      .send({
        name: "Organizador",
        email: `owner-${suffix}@example.com`,
        password: "teste-seguro-123",
      })
      .expect(201);
    users.push(ownerSignup.body.id);
    assert.equal(ownerSignup.body.passwordHash, undefined);
    const outsiderSignup = await outsider
      .post("/api/auth/register")
      .set("Origin", origin)
      .send({
        name: "Outro jogador",
        email: `other-${suffix}@example.com`,
        password: "teste-seguro-123",
      })
      .expect(201);
    users.push(outsiderSignup.body.id);
    await owner.get("/api/auth/me").expect(200);
    await guest.get("/api/groups").expect(401);
    await owner
      .post("/api/groups")
      .set("Origin", "https://outro.example")
      .send({ name: "Bloqueado" })
      .expect(403);

    const g = await owner
      .post("/api/groups")
      .set("Origin", origin)
      .send({ name: "Futebol de teste", teamCount: 2 })
      .expect(201);
    groupIds.push(g.body.id);
    const groupPath = `/api/groups/${g.body.id}`;
    await outsider.get(groupPath).expect(404);
    const otherGroup = await outsider
      .post("/api/groups")
      .set("Origin", origin)
      .send({ name: "Outro grupo" })
      .expect(201);
    groupIds.push(otherGroup.body.id);

    const created = await owner
      .post(`${groupPath}/matches`)
      .set("Origin", origin)
      .send({
        title: "Racha de teste",
        scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
        location: "Quadra teste",
        minPlayers: 2,
        maxPlayers: 2,
      })
      .expect(201);
    const matchPath = `${groupPath}/matches/${created.body.id}`;
    const presencePath = `/api/presence/${created.body.presenceToken}`;
    await outsider
      .get(`/api/groups/${otherGroup.body.id}/matches/${created.body.id}`)
      .expect(404);
    await owner
      .post(`${matchPath}/presence`)
      .set("Origin", origin)
      .send({})
      .expect(201);
    await owner
      .post(`${matchPath}/presence`)
      .set("Origin", origin)
      .send({})
      .expect(409);

    await t.test(
      "duas confirmações concorrentes disputam a última vaga",
      async () => {
        const responses = await Promise.all(
          ["Convidado A", "Convidado B"].map((name) =>
            guest.post(presencePath).set("Origin", origin).send({ name }),
          ),
        );
        assert.deepEqual(responses.map((r) => r.status).sort(), [201, 422]);
        const successful = responses.find((r) => r.status === 201)!;
        await owner
          .post(`${matchPath}/teams`)
          .set("Origin", origin)
          .send({})
          .expect(200);
        const drawn = await owner.get(matchPath).expect(200);
        assert.equal(drawn.body.presences.length, 2);
        assert.equal(drawn.body.teams.length, 2);
        const publicResult = await guest.get(presencePath).expect(200);
        assert.equal(publicResult.body.presences.length, 2);
        assert.equal(
          JSON.stringify(publicResult.body).includes("cancelHash"),
          false,
        );
        assert.equal(
          JSON.stringify(publicResult.body).includes("@example.com"),
          false,
        );
        await guest
          .delete(presencePath)
          .set("Origin", origin)
          .send({ cancelToken: "0".repeat(64) })
          .expect(404);
        await guest
          .delete(presencePath)
          .set("Origin", origin)
          .send({ cancelToken: successful.body.cancelToken })
          .expect(204);
        const afterCancel = await owner.get(matchPath).expect(200);
        assert.equal(afterCancel.body.presences.length, 1);
        assert.equal(afterCancel.body.teams.length, 0);
      },
    );

    await outsider
      .post("/api/groups/join")
      .set("Origin", origin)
      .send({ token: g.body.inviteToken })
      .expect(200);
    const asMember = await outsider.get(groupPath).expect(200);
    assert.equal(asMember.body.inviteToken, undefined);
    await outsider
      .post(`${matchPath}/teams`)
      .set("Origin", origin)
      .send({})
      .expect(403);
    await outsider
      .post(`${matchPath}/presence`)
      .set("Origin", origin)
      .send({})
      .expect(201);
    await owner
      .post(`${matchPath}/cancel`)
      .set("Origin", origin)
      .send({})
      .expect(204);
    await outsider
      .delete(`${matchPath}/presence`)
      .set("Origin", origin)
      .send({})
      .expect(422);
    await owner
      .post("/api/auth/logout")
      .set("Origin", origin)
      .send({})
      .expect(204);
    await owner.get("/api/auth/me").expect(401);
    await owner
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({
        email: `owner-${suffix}@example.com`,
        password: "senha-errada-123",
      })
      .expect(401);
    await owner
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({
        email: `owner-${suffix}@example.com`,
        password: "teste-seguro-123",
      })
      .expect(200);
  } finally {
    await db.group.deleteMany({ where: { id: { in: groupIds } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
});
