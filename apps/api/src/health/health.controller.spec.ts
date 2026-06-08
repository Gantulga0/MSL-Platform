import { HealthController } from './health.controller';

describe('HealthController', () => {
  const controller = new HealthController();

  it('reports ok status for the msl-api service', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('msl-api');
  });

  it('returns an ISO-8601 timestamp', () => {
    const result = controller.check();
    expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });
});
