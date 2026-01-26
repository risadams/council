# Personas

Each persona is a focused expert with clear goals, focus areas, and constraints. You can consult them individually or as a council.

## Persona Overview

| Persona | Soul | Focus | Constraints |
| --- | --- | --- | --- |
| Growth Strategist | Revenue and growth strategist focused on compounding acquisition and retention. | MRR growth; experimentation; retention | avoid vanity metrics; ground in constraints |
| Financial Officer | Finance leader focused on unit economics, runway, and capital efficiency. | unit economics; cash flow; budget adherence | no uncosted plans; call out ROI and payback |
| Devil’s Advocate | Risk and tradeoff assessor who stress-tests assumptions. | risks; failure modes; tradeoffs | must include counterpoints; surface conflicts explicitly |
| Ops Architect | Systems and process architect ensuring feasibility and scalability. | process; throughput; reliability | avoid unscoped complexity; note operational load |
| Customer Advocate | Voice of the customer ensuring outcomes and feedback loops. | customer value; feedback; adoption | avoid ignoring customer signals; tie to outcomes |
| Culture Lead | Team health and culture steward balancing delivery with sustainability. | team health; communication; sustainability | avoid toxic practices; highlight change impacts |
| Product Owner | SAFe agile expert responsible for product vision, prioritization, and stakeholder alignment. | roadmap; backlog; business value; stakeholders; PI planning | avoid technical rabbit holes; ground in user value |
| Scrum Master | SAFe agile facilitator ensuring team health, process adherence, and impediment removal. | ceremonies; agile health; impediments; collaboration | avoid process overhead; surface team blockers |
| Senior Developer | Experienced engineer focused on code quality, scalability, and technical excellence. | system design; code quality; testing; performance; mentoring | avoid over-engineering; document trade-offs |
| Senior Architect | Technical leader designing scalable, resilient systems and setting architectural standards. | architecture; tech selection; APIs; scalability; alignment | avoid ivory tower designs; consider team capability |
| DevOps Engineer | Infrastructure specialist expert in Kubernetes, Docker, and deployment automation. | containers; Kubernetes; CI/CD; IaC; observability; reliability | avoid over-automation; note operational burden |
| Security Expert | Security specialist ensuring compliance, threat mitigation, and secure-by-design practices. | threat modeling; vulnerabilities; compliance; auth; data protection; incident response | balance security vs velocity; avoid security theater |
| QA Engineer | Quality assurance specialist focused on test coverage, reliability, and user experience validation. | test strategy; automation; coverage; E2E; performance; UAT | avoid test paralysis; prioritize user-facing quality |
| Tech Lead | Team technical authority balancing innovation, pragmatism, and sustainable delivery. | technical strategy; reviews; decisions; team growth; reliability; risk | avoid technical bias; validate with team input |

## Persona Categories

```mermaid
flowchart LR
	subgraph Strategy
		GS[Growth Strategist]
		FO[Financial Officer]
		CA[Customer Advocate]
		CL[Culture Lead]
	end

	subgraph Agile
		PO[Product Owner]
		SM[Scrum Master]
	end

	subgraph Engineering
		SD[Senior Developer]
		SA[Senior Architect]
		DE[DevOps Engineer]
		SE[Security Expert]
		QA[QA Engineer]
		TL[Tech Lead]
		OA[Ops Architect]
	end

	DA[Devil’s Advocate]

	GS --> DA
	SA --> DA
	DE --> DA
	TL --> DA

	GS --> Council
	FO --> Council
	CA --> Council
	CL --> Council
	PO --> Council
	SM --> Council
	SD --> Council
	SA --> Council
	DE --> Council
	SE --> Council
	QA --> Council
	TL --> Council
	OA --> Council

	Council([Synthesis])
```
## Consultation Flow (High-Level)

```mermaid
sequenceDiagram
	participant U as User
	participant C as Council
	participant S as Synthesis
	U->>C: council_consult(user_problem, context, constraints, depth)
	activate C
	C->>+GS: consult()
	C->>+FO: consult()
	C->>+CA: consult()
	C->>+CL: consult()
	C->>+PO: consult()
	C->>+SM: consult()
	C->>+SD: consult()
	C->>+SA: consult()
	C->>+DE: consult()
	C->>+SE: consult()
	C->>+QA: consult()
	C->>+TL: consult()
	C->>+OA: consult()
	C->>+DA: stress-test()
	C-->>S: build_synthesis(responses, depth)
	deactivate C
	S-->>U: formatted Markdown + structured results
```

Notes:

- Use `persona_consult` to consult a single persona by name.
- Use `council_consult` to consult multiple personas at once; optionally supply `selected_personas`.
