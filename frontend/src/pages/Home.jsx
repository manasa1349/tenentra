import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import '../styles/home.css';

const platformHighlights = [
  { label: 'Tenant Isolation', value: 'Strict by design' },
  { label: 'Role Security', value: 'RBAC enforced' },
  { label: 'Average Setup', value: '< 10 mins' },
  { label: 'System Uptime', value: '99.9%' },
];

const featureCards = [
  {
    title: 'Tenant-Scoped Data Model',
    description:
      'Every operation is scoped by tenant boundaries so organizations can operate in one platform without data leakage risk.',
    tag: 'Architecture',
    tone: 'architecture',
  },
  {
    title: 'Role-Aware Workflows',
    description:
      'Admins and contributors get focused capabilities with permission enforcement at both API and UI level for consistency.',
    tag: 'Security',
    tone: 'security',
  },
  {
    title: 'Project Delivery Control',
    description:
      'Track project status, task priorities, ownership, and due windows in one operational flow that supports real execution.',
    tag: 'Control',
    tone: 'control',
  },
  {
    title: 'Operational Visibility',
    description:
      'Dashboards and task views provide clear workload visibility, allowing teams to review progress and unblock quickly.',
    tag: 'Insights',
    tone: 'insights',
  },
  {
    title: 'Personal Preferences',
    description:
      'Users manage profile, password, notifications, and default task view behavior to match their working style.',
    tag: 'Experience',
    tone: 'experience',
  },
  {
    title: 'Deployment Friendly',
    description:
      'Container-first setup, clean project structure, and complete docs make onboarding and handover straightforward.',
    tag: 'Delivery',
    tone: 'delivery',
  },
];

const processSteps = [
  {
    title: 'Create Your Tenant',
    description:
      'Register your organization, create the tenant admin account, and establish an isolated workspace ready for team onboarding.',
  },
  {
    title: 'Configure Team Access',
    description:
      'Invite users, assign roles, and set governance boundaries so every person has the right scope and responsibility.',
  },
  {
    title: 'Plan and Assign',
    description:
      'Create projects, break work into tasks, assign owners, and define deadlines with priority labels for better control.',
  },
  {
    title: 'Track and Optimize',
    description:
      'Review dashboards, monitor task movement, and continuously optimize delivery speed using clear visibility signals.',
  },
];

const productSlides = [
  {
    title: 'Command Dashboard',
    description:
      'KPI-focused summary of project portfolio, completion trajectory, and pending workload distribution across teams.',
    image: '/images/dashboard.png',
    points: [
      'Real-time counts for projects and task status',
      'Quick lens into active priorities and overdue signals',
      'Execution review ready for daily standups',
    ],
  },
  {
    title: 'Portfolio and Projects',
    description:
      'Manage active, completed, and archived initiatives with clean ownership visibility and predictable project governance.',
    image: '/images/project.png',
    points: [
      'Lifecycle status management from one view',
      'Ownership clarity for each project stream',
      'Simple access to project-level details and tasks',
    ],
  },
  {
    title: 'Execution Board',
    description:
      'Use board and list views for status transitions, dependency visibility, and better cross-functional execution discipline.',
    image: '/images/task.png',
    points: [
      'Move tasks through standardized stages',
      'Filter by assignee, status, and priority quickly',
      'Track delivery pace with focused visibility',
    ],
  },
];

const customerStories = [
  {
    company: 'Northline Systems',
    role: 'Operations Lead',
    score: '4.9 / 5',
    quote:
      'Tenantra improved our execution rituals because every team finally had one shared source of delivery truth with no cross-tenant concerns.',
  },
  {
    company: 'BluePeak Ventures',
    role: 'Engineering Manager',
    score: '4.8 / 5',
    quote:
      'Role boundaries are practical and clear. Admin governance is secure, while contributors stay focused on their assigned outcomes.',
  },
  {
    company: 'Crestfield Labs',
    role: 'Program Director',
    score: '4.9 / 5',
    quote:
      'The platform is stable and readable for both leadership and delivery teams, which made reporting and execution finally align.',
  },
  {
    company: 'Arcwell Digital',
    role: 'Delivery Head',
    score: '4.7 / 5',
    quote:
      'Our weekly planning sessions became sharper because owners, priorities, and deadlines are consistently visible in one flow.',
  },
  {
    company: 'HarborGrid',
    role: 'CTO',
    score: '4.8 / 5',
    quote:
      'Tenant-level segmentation helped us manage multiple client workspaces safely without creating separate disconnected tools.',
  },
  {
    company: 'LumenCore',
    role: 'PMO Lead',
    score: '4.9 / 5',
    quote:
      'The board and list views are practical in daily execution. We no longer waste cycles reconciling progress manually.',
  },
  {
    company: 'NovaBridge',
    role: 'Operations Manager',
    score: '4.8 / 5',
    quote:
      'The permission model gave us confidence to scale team access while keeping governance standards intact.',
  },
  {
    company: 'VertexPulse',
    role: 'Head of Engineering',
    score: '4.9 / 5',
    quote:
      'Clarity improved across squads because ownership and task transitions are visible without context switching.',
  },
  {
    company: 'CloudRiver',
    role: 'Program Manager',
    score: '4.8 / 5',
    quote:
      'Execution reviews are now data-backed and predictable, not spreadsheet-driven and fragmented.',
  },
  {
    company: 'PioneerWorks',
    role: 'Director of Delivery',
    score: '4.7 / 5',
    quote:
      'A formal product feel with real operational utility. It handles both governance and delivery needs effectively.',
  },
  {
    company: 'SignalForge',
    role: 'Delivery Manager',
    score: '4.8 / 5',
    quote:
      'We got instant value from the dashboard and role-safe controls, especially for distributed teams.',
  },
  {
    company: 'QuantNorth',
    role: 'Senior PM',
    score: '4.9 / 5',
    quote:
      'The overall experience feels structured and professional, which made stakeholder adoption much easier.',
  },
  {
    company: 'PeakScale',
    role: 'Engineering Director',
    score: '4.8 / 5',
    quote:
      'Clear tenant boundaries plus straightforward project tracking created immediate process maturity for our teams.',
  },
  {
    company: 'GridAlpha',
    role: 'Program Operations',
    score: '4.8 / 5',
    quote:
      'From onboarding to execution, the workflow is consistent and transparent, reducing operational ambiguity.',
  },
  {
    company: 'UrbanNex',
    role: 'Product Operations',
    score: '4.7 / 5',
    quote:
      'The interface remains clean even as project volume grows, which is essential for day-to-day control.',
  },
];

const faqs = [
  {
    q: 'How is tenant data isolation enforced in day-to-day usage?',
    a: 'Tenant isolation is enforced through a layered approach. APIs validate tenant context from authenticated tokens, database queries are scoped with tenant identifiers, and role checks are executed before each action. In practice, this means records from one organization remain inaccessible to another, even when everyone operates within the same shared platform runtime and infrastructure.',
  },
  {
    q: 'Can regular users manage other users or change access controls?',
    a: 'No. User management remains restricted to tenant admins so governance stays controlled and auditable. Regular users can contribute to execution by updating assigned work and managing their own profile/settings, but they do not get identity-management privileges. This separation keeps the operating model formal and reduces permission-related risk in real team scenarios.',
  },
  {
    q: 'How does Tenantra support teams with different working styles?',
    a: 'The platform combines standardized governance with personal flexibility. Teams operate on consistent project/task structures, while each user can still configure personal notification settings and default task-view preference. This balance helps maintain organizational consistency without forcing every individual into exactly the same interaction pattern.',
  },
  {
    q: 'Is mobile and tablet usage fully supported for operational tasks?',
    a: 'Yes. The interface is adapted for mobile, tablet, and desktop breakpoints with responsive typography, drawer-based navigation for compact screens, and horizontally scrollable dense data tables where needed. This ensures that detailed task and project information remains accessible even on small screens without cutting off critical fields.',
  },
];

const useCaseContent = {
  engineering: {
    title: 'Engineering Delivery',
    text: 'Track sprint execution, blockers, owner-level accountability, and completion readiness across distributed engineering teams with clear status transitions and practical workload visibility.',
  },
  operations: {
    title: 'Operations Management',
    text: 'Coordinate service initiatives, internal tasks, and cross-functional ownership with visible priorities and realistic planning windows so teams can execute with fewer handoff gaps.',
  },
  consulting: {
    title: 'Client Portfolio Management',
    text: 'Maintain project structures per client tenant while preserving strict boundaries and formal accountability across delivery teams and project stakeholders.',
  },
};

const statTargets = {
  projects: 120,
  tasks: 4200,
  teams: 75,
  satisfaction: 98,
};

const getVisibleCustomerCards = (width) => {
  if (width >= 1180) return 3;
  if (width >= 760) return 2;
  return 1;
};

export default function Home({ isAuthenticated = false }) {
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [customerStart, setCustomerStart] = useState(0);
  const [visibleCustomers, setVisibleCustomers] = useState(getVisibleCustomerCards(window.innerWidth));
  const [activeFaq, setActiveFaq] = useState(0);
  const [activeUseCase, setActiveUseCase] = useState('engineering');
  const [stats, setStats] = useState({ projects: 0, tasks: 0, teams: 0, satisfaction: 0 });
  const [contact, setContact] = useState({ name: '', email: '', topic: '', message: '' });

  useEffect(() => {
    const onResize = () => setVisibleCustomers(getVisibleCustomerCards(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const productTimer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % productSlides.length);
    }, 5200);

    return () => clearInterval(productTimer);
  }, []);

  useEffect(() => {
    const customerTimer = setInterval(() => {
      setCustomerStart((prev) => (prev + 1) % customerStories.length);
    }, 5000);

    return () => clearInterval(customerTimer);
  }, []);

  useEffect(() => {
    const start = Date.now();
    const duration = 1100;

    const timer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / duration);

      setStats({
        projects: Math.round(statTargets.projects * progress),
        tasks: Math.round(statTargets.tasks * progress),
        teams: Math.round(statTargets.teams * progress),
        satisfaction: Math.round(statTargets.satisfaction * progress),
      });

      if (progress >= 1) {
        clearInterval(timer);
      }
    }, 30);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setHomeMenuOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  const currentUseCase = useMemo(() => useCaseContent[activeUseCase], [activeUseCase]);
  const displayedCustomers = useMemo(() => {
    return Array.from({ length: visibleCustomers }, (_, index) => {
      const storyIndex = (customerStart + index) % customerStories.length;
      return customerStories[storyIndex];
    });
  }, [customerStart, visibleCustomers]);

  const handleContactSubmit = (event) => {
    event.preventDefault();
    if (!contact.name.trim() || !contact.email.trim() || !contact.message.trim()) {
      toast.error('Please fill name, email, and message fields');
      return;
    }

    toast.success('Thanks. Our team will reach out shortly.');
    setContact({ name: '', email: '', topic: '', message: '' });
  };

  return (
    <div className='home-page'>
      <header className='home-nav'>
        <div className='home-nav-inner'>
          <div className='home-brand'>
            <span className='home-brand-dot' />
            <span className='home-brand-word'>Tenantra</span>
          </div>

          <nav className='home-links'>
            <a href='#features'>Features</a>
            <a href='#workflow'>Workflow</a>
            <a href='#product'>Product</a>
            <a href='#ratings'>Customers</a>
            <a href='#faq'>FAQ</a>
          </nav>

          <div className='home-nav-actions'>
            {isAuthenticated ? (
              <Link to='/dashboard' className='solid-btn'>
                Open Workspace
              </Link>
            ) : (
              <>
                <Link to='/login' className='ghost-btn'>
                  Sign In
                </Link>
                <Link to='/register' className='solid-btn'>
                  Start Free
                </Link>
              </>
            )}
          </div>

          <button
            type='button'
            className='home-menu-toggle'
            onClick={() => setHomeMenuOpen(true)}
            aria-label='Open home navigation menu'
          >
            <span className='hamburger-icon' aria-hidden='true'>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>

        {homeMenuOpen && (
          <>
            <button
              type='button'
              className='home-nav-overlay'
              onClick={() => setHomeMenuOpen(false)}
              aria-label='Close home navigation menu'
            />
            <aside className='home-drawer'>
              <div className='home-drawer-top'>
                <strong>Navigate</strong>
                <button type='button' onClick={() => setHomeMenuOpen(false)}>
                  Close
                </button>
              </div>

              <div className='home-drawer-links'>
                <a href='#features' onClick={() => setHomeMenuOpen(false)}>
                  Features
                </a>
                <a href='#workflow' onClick={() => setHomeMenuOpen(false)}>
                  Workflow
                </a>
                <a href='#product' onClick={() => setHomeMenuOpen(false)}>
                  Product
                </a>
                <a href='#ratings' onClick={() => setHomeMenuOpen(false)}>
                  Customers
                </a>
                <a href='#faq' onClick={() => setHomeMenuOpen(false)}>
                  FAQ
                </a>
              </div>

              <div className='home-drawer-actions'>
                {isAuthenticated ? (
                  <Link to='/dashboard' onClick={() => setHomeMenuOpen(false)}>
                    Open Workspace
                  </Link>
                ) : (
                  <>
                    <Link to='/login' onClick={() => setHomeMenuOpen(false)}>
                      Sign In
                    </Link>
                    <Link to='/register' onClick={() => setHomeMenuOpen(false)}>
                      Create Tenant
                    </Link>
                  </>
                )}
              </div>
            </aside>
          </>
        )}
      </header>

      <main className='home-main'>
        <section className='hero'>
          <p className='eyebrow'>Multi-Tenant Project Operations Platform</p>
          <h1>Run Distributed Teams with Confidence, Clarity, and Secure Boundaries.</h1>
          <p className='hero-copy'>
            Tenantra helps organizations plan, assign, and monitor work with role-safe controls,
            tenant isolation, and practical execution views built for day-to-day operations.
          </p>
          <div className='hero-actions'>
            {isAuthenticated ? (
              <Link to='/dashboard' className='solid-btn'>
                Continue to Dashboard
              </Link>
            ) : (
              <>
                <Link to='/register' className='solid-btn'>
                  Create Tenant
                </Link>
                <Link to='/login' className='ghost-btn'>
                  Open Login
                </Link>
              </>
            )}
          </div>
        </section>

        <section className='metric-strip'>
          <article>
            <h3>{stats.projects}+</h3>
            <p>Projects Managed</p>
          </article>
          <article>
            <h3>{stats.tasks}+</h3>
            <p>Tasks Tracked</p>
          </article>
          <article>
            <h3>{stats.teams}+</h3>
            <p>Active Teams</p>
          </article>
          <article>
            <h3>{stats.satisfaction}%</h3>
            <p>Customer Satisfaction</p>
          </article>
        </section>

        <section className='highlight-grid'>
          {platformHighlights.map((item) => (
            <article key={item.label} className='highlight-card'>
              <p>{item.label}</p>
              <h3>{item.value}</h3>
            </article>
          ))}
        </section>

        <section className='feature-grid' id='features'>
          {featureCards.map((item) => (
            <article key={item.title} className='feature-card'>
              <span className={`feature-icon tone-${item.tone}`}>{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </section>

        <section className='use-case-section'>
          <div className='use-case-tabs'>
            <button
              type='button'
              className={activeUseCase === 'engineering' ? 'active' : ''}
              onClick={() => setActiveUseCase('engineering')}
            >
              Engineering
            </button>
            <button
              type='button'
              className={activeUseCase === 'operations' ? 'active' : ''}
              onClick={() => setActiveUseCase('operations')}
            >
              Operations
            </button>
            <button
              type='button'
              className={activeUseCase === 'consulting' ? 'active' : ''}
              onClick={() => setActiveUseCase('consulting')}
            >
              Consulting
            </button>
          </div>

          <article className='use-case-card'>
            <h3>{currentUseCase.title}</h3>
            <p>{currentUseCase.text}</p>
          </article>
        </section>

        <section className='process-section' id='workflow'>
          <h2>How Teams Work with Tenantra</h2>
          <div className='process-track'>
            {processSteps.map((step, index) => (
              <article key={step.title} className='process-card'>
                <span>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className='product-showcase' id='product'>
          <div className='showcase-top'>
            <h2>Product Experience</h2>
            <div className='slide-controls'>
              {productSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type='button'
                  className={index === slideIndex ? 'active' : ''}
                  onClick={() => setSlideIndex(index)}
                  aria-label={`View product slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <article className='showcase-card'>
            <img src={productSlides[slideIndex].image} alt={productSlides[slideIndex].title} />
            <div>
              <h3>{productSlides[slideIndex].title}</h3>
              <p>{productSlides[slideIndex].description}</p>
              <ul>
                {productSlides[slideIndex].points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </article>
        </section>

        <section className='customer-section' id='ratings'>
          <h2>Customer Stories</h2>

          <div className={`customer-grid cols-${visibleCustomers}`}>
            {displayedCustomers.map((story, index) => (
              <article className='customer-card' key={`${story.company}-${index}`}>
                <div className='customer-stars'>★★★★★</div>
                <h3>{story.score}</h3>
                <p className='customer-company'>
                  {story.company} • {story.role}
                </p>
                <p className='customer-quote'>"{story.quote}"</p>
              </article>
            ))}
          </div>

          <div className='customer-controls'>
            <button
              type='button'
              onClick={() =>
                setCustomerStart((prev) =>
                  prev === 0 ? customerStories.length - 1 : prev - 1
                )
              }
            >
              Previous
            </button>

            <button
              type='button'
              onClick={() =>
                setCustomerStart((prev) =>
                  prev === customerStories.length - 1 ? 0 : prev + 1
                )
              }
            >
              Next
            </button>
          </div>
        </section>

        <section className='faq-contact-section' id='faq'>
          <div className='faq-section'>
            <h2>Frequently Asked Questions</h2>
            <div className='faq-list'>
              {faqs.map((item, index) => (
                <article key={item.q} className='faq-item'>
                  <button
                    type='button'
                    className={activeFaq === index ? 'active' : ''}
                    onClick={() => setActiveFaq((prev) => (prev === index ? -1 : index))}
                  >
                    <span>{item.q}</span>
                    <span>{activeFaq === index ? '−' : '+'}</span>
                  </button>
                  {activeFaq === index && <p>{item.a}</p>}
                </article>
              ))}
            </div>
          </div>

          <aside className='contact-panel'>
            <h3>Need More Details?</h3>
            <p>
              Share your use-case and our team will help you map Tenantra capabilities to your
              delivery workflow.
            </p>

            <form onSubmit={handleContactSubmit} className='contact-form'>
              <input
                type='text'
                placeholder='Your Name'
                value={contact.name}
                onChange={(event) => setContact((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                type='email'
                placeholder='Work Email'
                value={contact.email}
                onChange={(event) =>
                  setContact((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <input
                type='text'
                placeholder='Topic (optional)'
                value={contact.topic}
                onChange={(event) =>
                  setContact((prev) => ({ ...prev, topic: event.target.value }))
                }
              />
              <textarea
                placeholder='Tell us what you want to achieve...'
                value={contact.message}
                onChange={(event) =>
                  setContact((prev) => ({ ...prev, message: event.target.value }))
                }
              />
              <button type='submit'>Send Request</button>
            </form>
          </aside>
        </section>

        <section className='cta-card'>
          <div>
            <h2>Bring Structured Execution to Your Organization</h2>
            <p>
              Build predictable delivery workflows with secure tenant boundaries and role-first
              operations.
            </p>
          </div>
          {isAuthenticated ? (
            <Link to='/dashboard' className='solid-btn'>
              Continue to App
            </Link>
          ) : (
            <Link to='/register' className='solid-btn'>
              Launch Your Tenant
            </Link>
          )}
        </section>

        <footer className='home-footer'>
          <p>Tenantra</p>
          <div>
            <a href='#features'>Features</a>
            <a href='#product'>Product</a>
            <a href='#faq'>FAQ</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
