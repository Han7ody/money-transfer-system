export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface TransitionContext {
  userId: string;
  reason?: string;
  metadata?: any;
}

export interface TransitionHooks<TState> {
  onEnter?: (state: TState, context: TransitionContext) => Promise<void>;
  onExit?: (state: TState, context: TransitionContext) => Promise<void>;
}

export interface IStateMachine<TState> {
  canTransition(from: TState, to: TState): boolean;
  validateTransition(from: TState, to: TState, context: TransitionContext): Promise<ValidationResult>;
  executeTransition(from: TState, to: TState, context: TransitionContext): Promise<void>;
  getAllowedTransitions(from: TState): TState[];
}
