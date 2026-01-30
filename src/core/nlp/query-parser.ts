/**
 * Natural Language Query Parser
 * Issue #44: Natural Language Cost Queries
 */

export type QueryType =
  | 'cost-lookup'
  | 'comparison'
  | 'trend'
  | 'forecast'
  | 'recommendation'
  | 'anomaly'
  | 'list'
  | 'unknown';

export interface ParsedQuery {
  type: QueryType;
  service?: string;
  timeframe?: string;
  comparison?: {
    a: string;
    b: string;
  };
  intent: string;
  confidence: number;
}

/**
 * Pattern-based natural language query parser
 * Future: Can be replaced with LLM integration
 */
export class QueryParser {
  private patterns = {
    costLookup: [
      /what(?:'s| is) (?:my|the) ([\w\s-]+) (?:spend|cost|bill)/i,
      /how much (?:am i|did i|have i) spend(?:ing)?(?: on)? ([\w\s-]+)/i,
      /(?:show|get) (?:me )?(?:my )?([\w\s-]+) costs?/i,
    ],
    comparison: [
      /compare ([\w\s-]+) (?:vs|versus|and|to) ([\w\s-]+)/i,
      /(?:difference|diff) between ([\w\s-]+) and ([\w\s-]+)/i,
      /([\w\s-]+) vs (?:the )?([\w\s-]+)/i,
    ],
    trend: [
      /what (?:increased|decreased|went up|went down)/i,
      /(?:show|get) (?:me )?(?:the )?trend/i,
      /(?:which|what) service (?:increased|decreased) (?:the )?most/i,
    ],
    forecast: [
      /what will (?:my|the) ([\w\s-]+) (?:be|cost)/i,
      /(?:forecast|predict|project)/i,
      /(?:end of|month end|eom)/i,
    ],
    recommendation: [
      /how (?:can|do) i (?:save|reduce|optimize)/i,
      /(?:suggest|recommend)(?:ation)?/i,
      /ways to (?:save|reduce|cut) (?:costs?|spending)/i,
    ],
    anomaly: [
      /why (?:did|is) ([\w\s-]+) (?:go up|increase|spike|jump)/i,
      /what(?:'s| is) (?:causing|driving) (?:the )?([\w\s-]+)/i,
      /(?:explain|analyze) (?:the )?([\w\s-]+)/i,
    ],
    list: [
      /(?:show|list|get) (?:me )?(?:all )?(?:my )?([\w\s-]+)/i,
      /what are my ([\w\s-]+)/i,
    ],
  };

  private services = [
    'ec2',
    'rds',
    's3',
    'lambda',
    'dynamodb',
    'eks',
    'elb',
    'cloudfront',
    'all',
  ];

  private timeframes = [
    'today',
    'yesterday',
    'this week',
    'last week',
    'this month',
    'last month',
    'this quarter',
    'this year',
  ];

  /**
   * Parse natural language query into structured format
   */
  parse(query: string): ParsedQuery {
    const normalized = query.toLowerCase().trim();

    // Check each pattern type
    for (const [type, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const match = normalized.match(pattern);
        if (match) {
          return this.buildParsedQuery(type as QueryType, match, query);
        }
      }
    }

    // Unknown query type
    return {
      type: 'unknown',
      intent: query,
      confidence: 0,
    };
  }

  private buildParsedQuery(type: QueryType, match: RegExpMatchArray, originalQuery: string): ParsedQuery {
    const parsed: ParsedQuery = {
      type,
      intent: originalQuery,
      confidence: 0.8,
    };

    // Extract service if mentioned
    const service = this.extractService(originalQuery);
    if (service) {
      parsed.service = service;
    }

    // Extract timeframe if mentioned
    const timeframe = this.extractTimeframe(originalQuery);
    if (timeframe) {
      parsed.timeframe = timeframe;
    }

    // Handle comparison queries
    if (type === 'comparison' && match[1] && match[2]) {
      parsed.comparison = {
        a: match[1].trim(),
        b: match[2].trim(),
      };
    }

    return parsed;
  }

  private extractService(query: string): string | undefined {
    const normalized = query.toLowerCase();
    for (const service of this.services) {
      if (normalized.includes(service)) {
        return service.toUpperCase();
      }
    }
    return undefined;
  }

  private extractTimeframe(query: string): string | undefined {
    const normalized = query.toLowerCase();
    for (const timeframe of this.timeframes) {
      if (normalized.includes(timeframe)) {
        return timeframe;
      }
    }
    return undefined;
  }

  /**
   * Suggest similar queries for unknown inputs
   */
  suggestQueries(): string[] {
    return [
      "what's my EC2 spend this month?",
      'which service increased the most?',
      'compare production vs staging costs',
      'show me unused resources',
      'what will my bill be at month end?',
      'how can I save money?',
      'why did my costs go up yesterday?',
    ];
  }
}
