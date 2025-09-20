import MiniSearch from 'minisearch';
import type { Options as MiniSearchOptions, SearchOptions as MiniSearchSearchOptions } from 'minisearch';
import type { CongressionalData, SearchResult } from './types';

type Doc = {
  id: string;
  type: 'cluster' | 'thread' | 'comment' | 'idea';
  clusterId: string;
  title?: string;
  text: string;
  author?: string;
  timestamp?: string;
};

export class SearchEngine {
  private mini: MiniSearch<Doc>;

  constructor() {
    const options: MiniSearchOptions<Doc> = {
      fields: ['title', 'text', 'author'],
      storeFields: ['id', 'type', 'clusterId', 'title', 'text', 'author', 'timestamp'],
      searchOptions: {
        boost: { title: 3, text: 2, author: 1 },
        prefix: true,
        fuzzy: 0.2,
        combineWith: 'AND',
      } as MiniSearchSearchOptions,
      tokenize: (string) => string.split(/[\s\-_/.,:;]+/),
    };

    this.mini = new MiniSearch<Doc>(options);
  }

  buildIndex(data: CongressionalData) {
    const docs: Doc[] = [];

    for (const cluster of data.hasPart) {
      docs.push({
        id: `cluster:${cluster['@id']}`,
        type: 'cluster',
        clusterId: cluster['@id'],
        title: cluster.name,
        text: cluster.description,
      });

      for (const idea of cluster.itemListElement) {
        docs.push({
          id: `idea:${cluster['@id']}:${idea['@id']}`,
          type: 'idea',
          clusterId: cluster['@id'],
          title: idea.text.slice(0, 60),
          text: idea.text,
        });
      }

      for (const thread of cluster['cx:threads']) {
        docs.push({
          id: `thread:${cluster['@id']}:${thread['@id']}`,
          type: 'thread',
          clusterId: cluster['@id'],
          title: thread.name,
          text: thread.summary,
        });

        for (const comment of thread['cx:comments']) {
          docs.push({
            id: `comment:${cluster['@id']}:${thread['@id']}:${comment['@id']}`,
            type: 'comment',
            clusterId: cluster['@id'],
            title: comment.text.slice(0, 60),
            text: comment.text,
            author: comment.author,
            timestamp: comment.startTime,
          });
        }
      }
    }

    this.mini.removeAll();
    this.mini.addAll(docs);
  }

  search(query: string): SearchResult[] {
    if (!query.trim()) return [];
    const results = this.mini.search(query) as unknown as Array<Doc & { score: number; match: any }>;

    return results.map(r => ({
      type: r.type,
      id: r.id,
      clusterId: r.clusterId,
      text: r.title || r.text,
      matches: [],
      score: r.score,
    }));
  }
}


