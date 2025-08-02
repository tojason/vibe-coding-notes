# AI Agent Collaboration Patterns

## Multi-Phase Development Workflow

### Structured 3-Phase Process (Used in vibe-coding-website)
1. **Phase 1 - UX Research**: `ux-researcher` agent
   - Analyzes user workflows and requirements  
   - Maps user journeys and interaction patterns
   - Outputs research findings to `01-ux-research.md`

2. **Phase 2 - UI Design**: `ui-designer` agent  
   - Creates visual design systems and specifications
   - Designs responsive layouts and component systems
   - Outputs design specs to `02-ui-design.md`

3. **Phase 3 - Implementation**: `frontend-developer` agent
   - Builds production-ready code from research and design
   - Implements responsive, accessible interfaces
   - Outputs technical notes to `03-frontend-implementation.md`

### Agent Handoff Protocol
```
project/
├── agent-outputs/           # Sequential agent outputs
│   ├── 01-phase-name.md    # First agent deliverables
│   ├── 02-phase-name.md    # Second agent deliverables  
│   └── 03-phase-name.md    # Final agent deliverables
├── handoff-documentation.md # Phase coordination notes
├── project-requirements.md  # Locked scope (unchanged)
└── src/                    # Final implementation
```

## Proactive Agent Triggers

### Automatic Activation
- **studio-coach**: Complex multi-agent tasks, guidance needed
- **test-writer-fixer**: After feature implementation or bug fixes
- **whimsy-injector**: After UI/UX changes to add delight
- **experiment-tracker**: When feature flags are added

### Cross-Department Collaboration
- **Engineering + Design**: UI implementation from design specs
- **Product + Marketing**: Feature prioritization with growth impact
- **Testing + Engineering**: Quality assurance integration
- **Operations + All**: Process optimization across departments

## Best Practices for Agent Coordination

### Scope Management
- Lock requirements before starting multi-agent workflow
- Prevent scope creep during handoffs
- Each agent builds incrementally on previous work

### Documentation Standards
- Each agent saves structured output to designated location
- Maintain complete decision trail for future reference
- Update handoff documentation after each phase

### Quality Assurance
- Validate each phase output before proceeding
- Ensure previous insights are properly incorporated
- Maintain design system and technical consistency

## 6-Day Sprint Philosophy

All agents are optimized for rapid iteration within 6-day sprint cycles:
- **Speed**: Ship features in days, not weeks
- **Quality**: Maintain high standards through specialized expertise  
- **Focus**: Prevent over-engineering through time constraints
- **Iteration**: Fast feedback loops and continuous improvement