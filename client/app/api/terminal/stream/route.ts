import { NextRequest } from 'next/server';
import { TerminalManager } from '@/lib/terminal/terminal-manager';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const projectPath = searchParams.get('projectPath');

  if (!projectId || !projectPath) {
    return new Response(JSON.stringify({ error: 'Missing projectId or projectPath' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const session = TerminalManager.getOrCreateSession(projectId, projectPath);
  const encoder = new TextEncoder();

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection and status
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'status',
            running: session.isRunning,
            pid: session.pid
          })}\n\n`
        )
      );

      // Send backlog replay if exists
      if (session.backlog) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'backlog',
              data: session.backlog
            })}\n\n`
          )
        );
      }

      // Stream new incoming chunks
      const onData = (data: string) => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'data',
                data
              })}\n\n`
            )
          );
        } catch {}
      };

      const onStatus = (running: boolean) => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'status',
                running
              })}\n\n`
            )
          );
        } catch {}
      };

      session.listeners.add(onData);
      session.statusListeners.add(onStatus);

      cleanup = () => {
        session.listeners.delete(onData);
        session.statusListeners.delete(onStatus);
      };
    },
    cancel() {
      if (cleanup) cleanup();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
