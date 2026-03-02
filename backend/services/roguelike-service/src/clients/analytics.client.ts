interface RecordGameplayStatsPayload {
  userId: string;
  gameSlug: string;
  playtimeMinutes: number;
  runsCompleted: number;
  metrics: Record<string, number>;
  lastPlayedAt: string;
}

const ANALYTICS_GRAPHQL_URL = process.env.ANALYTICS_GRAPHQL_URL ?? 'http://localhost:4004/graphql';
const ANALYTICS_INGEST_TOKEN = process.env.ANALYTICS_INGEST_TOKEN ?? '';

export class AnalyticsClient {
  async recordGameplayStats(payload: RecordGameplayStatsPayload): Promise<void> {
    const query = `mutation RecordGameplayStats($input: RecordGameplayStatsInput!) {
      recordGameplayStats(input: $input) { id }
    }`;

    const variables = {
      input: {
        ...payload,
        metrics: Object.entries(payload.metrics).map(([key, value]) => ({ key, value })),
      },
    };

    const response = await fetch(ANALYTICS_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ANALYTICS_INGEST_TOKEN ? { 'x-service-token': ANALYTICS_INGEST_TOKEN } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Analytics ingest failed with status ${response.status}`);
    }

    const data = (await response.json()) as { errors?: Array<{ message: string }> };
    if (data.errors?.length) {
      throw new Error(data.errors[0].message);
    }
  }
}
