// Site copy, in one place (DESIGN.md Appendix A).
//
// Plain constants, deliberately: copy changes ship as code. Two claims are
// load-bearing and must stay true to the code: review is EDITORIAL (an editor
// reads every submission; never write "peer-reviewed" unless the process
// actually becomes peer review), and submission is free at every stage. There
// is deliberately no masthead until real editor names exist.
//
// The copy budget is a design rule (§2.3): one serif statement per screen,
// headlines ≤ 9 words, a lede ≤ 20, a section ≤ one paragraph of 45.

export const COPY = {
  home: {
    hero: {
      title: "Research on Central Asia, read with care",
      body: "An independent, edited review of the region's politics, economies and societies.",
      primary: "Read the issue",
      secondary: "Submit a paper",
    },
    issue: {
      allIssues: "All issues",
      allPapers: "All papers",
      emptyTitle: "The first issue is being edited",
      emptyBody: "Papers appear here as an editor accepts them.",
    },
    editorial: {
      statement:
        "An editor reads every submission in full. Accepted papers publish as they clear review and gather into quarterly issues.",
      attribution: "From the editors",
      link: "About the review",
    },
  },
  callForPapers: {
    title: "Call for submissions",
    body: "Finished papers, read year-round. No fee at any stage.",
    action: "Submit a paper",
    link: "For contributors",
  },
  papers: {
    title: "Papers",
    emptyTitle: "Nothing published yet",
    emptyBody: "The first papers are with an editor.",
    noMatchTitle: "Nothing matches",
    noMatchBody: "Try a shorter word, or an author's surname.",
    clear: "Clear search",
    // Search also reads abstracts (papers/page.tsx), so the field says so.
    searchPlaceholder: "Search titles, authors and abstracts",
  },
  issues: {
    title: "Issues",
    lede: "One issue per quarter, gathered from the papers that cleared review.",
    current: "This quarter",
    emptyTitle: "The first issue is being edited",
    emptyBody: "Issues gather each quarter's accepted papers.",
  },
  paper: {
    abstractLabel: "Abstract",
    freeWithAccount: "Free with an account",
    gate: {
      signedOutTitle: "Read the full paper",
      signedOutBody:
        "Papers are free to registered readers. A Google sign-in creates an account.",
      signedOutAction: "Sign in to download",
      why: "Why an account?",
      signedInTitle: "The full paper",
      signedInAction: "Download the PDF",
    },
    citeLabel: "Cite",
    alsoIn: "Also in",
    fullIssue: "The full issue",
  },
  about: {
    main: {
      title: "About the Review",
      lede: "Research on the politics, economies and societies of Central Asia. Independent, edited, free to read.",
      body: "Central Asian Review covers Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan and Uzbekistan, and the wider region where it bears on them. It is independent and published by Freshman Academy. Abstracts are public so the work can be found; the papers are free to registered readers.",
    },
    processLabel: "How a paper reaches a reader",
    process: [
      {
        title: "You send a paper",
        body: "One PDF, up to 10 MB, with an abstract that stands alone.",
      },
      {
        title: "An editor reads it",
        body: "In full, before anything appears. You hear back by email either way.",
      },
      {
        title: "It publishes, then binds",
        body: "Live once accepted, then gathered into that quarter's issue.",
      },
    ],
    coverage: {
      label: "Coverage",
      note: "And the wider region, where it bears on these five.",
    },
    contributors: {
      title: "For contributors",
      body: "An abstract that states the question, method and finding by itself: it is the part search engines read. Free at every stage.",
      action: "Submit a paper",
    },
    readers: {
      title: "For readers",
      body: "Abstracts are open to everyone. Papers are free to registered readers; a Google sign-in creates the account.",
      action: "Browse papers",
    },
  },
  login: {
    title: "Sign in",
    body: "Sign in to download papers or submit your own. Continuing with Google creates your account; there is no separate registration.",
    google: "Continue with Google",
    devLabel: "Local only",
    legal: "By continuing you accept the privacy notice.",
  },
  submit: {
    intro: {
      title: "Submit a paper",
      body: "An editor reads every submission in full; you are emailed when a decision is made.",
    },
    nextLabel: "What happens next",
    next: ["An editor reads it in full", "You hear back by email", "Accepted papers publish"],
    authorsHint: "As they should be cited: S. Ito, K. Mamatov",
    abstractHint: "States the question, the method and the finding.",
    fileHint: "Drop a PDF here, or choose a file. Up to 10 MB.",
    action: "Send for review",
    pending: "Sending…",
  },
  submissions: {
    title: "My submissions",
    emptyTitle: "No submissions yet",
    emptyBody: "Your papers and their review status will appear here.",
    noteLabel: "Editor's note",
    revise: "Submit a revision",
  },
  notifications: {
    title: "Notifications",
    markAll: "Mark all as read",
    emptyTitle: "Nothing new",
    emptyBody: "Decisions on your papers will appear here.",
  },
  notFound: {
    title: "Nothing at this address",
    body: "The page may have moved. The papers are all still here.",
    paperTitle: "No paper at this address",
    paperBody: "It may have been renamed or withdrawn.",
  },
  error: {
    title: "Something went wrong",
    body: "The fault is on our side. Trying again usually works.",
  },
  footer: {
    credit:
      "An independent review of scholarship on Central Asia, published by Freshman Academy.",
  },
} as const;
