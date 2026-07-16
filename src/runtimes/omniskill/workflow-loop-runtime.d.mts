export interface WorkflowLoopCliInput {
  argv?: string[];
  workflowJson?: string | URL;
  cwd?: string;
  homeDir?: string;
  stdout?: (value: string) => void;
  stderr?: (value: string) => void;
  commandPrefix?: (command: string) => string;
}

export function runWorkflowLoopCli(input?: WorkflowLoopCliInput): Promise<number>;
