// Site copy, in one place.
//
// Plain constants, deliberately. There is no database table and no admin editor
// behind this: copy changes ship as code, which for a publication of this size is
// simpler than maintaining a CMS surface nobody asked for.
//
// Register (PRODUCT.md): scholarly, warm, direct; the reader must never feel
// marketed to. Two claims are load-bearing and must stay true to the code:
// review is EDITORIAL (an editor reads submissions; do not write
// "peer-reviewed" unless the process actually becomes peer review), and
// submission is free. There is deliberately NO masthead section: until real
// editor names exist, a masthead reads as fabricated, which is worse for
// credibility than none (add it back with real names, never placeholders).

export const COPY = {
  home: {
    hero: {
      // Kept short: the hero has to fit the viewport, and a long subhead is a
      // font-scale problem rather than a copy-length one. "Read with care" is
      // the venue's actual promise, and the thing a topic label cannot say.
      title: "Research on Central Asia, read with care",
      body: "An independent, edited review of the region's politics, economies and societies. Abstracts are open to everyone; the full papers need only a free account.",
    },
    editorial: {
      title: "From the editors",
      body: "The review exists to give careful work on Central Asia a durable, citable home. An editor reads every submission in full; accepted papers publish as they clear review and are gathered into quarterly issues. New work appears through the year.",
    },
    callForPapers: {
      title: "Call for submissions",
      body: "We read submissions year-round from researchers, practitioners and graduate students working on the region. Send a finished paper as a single PDF; there is no fee at any stage.",
    },
  },
  about: {
    main: {
      title: "About the Review",
      body: "Central Asian Review publishes research, analysis and essays on the politics, economies and societies of Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan and Uzbekistan, together with work on the wider region where it bears on these five countries.\n\nThe review is independent and published by Freshman Academy. Every submission is read in full by an editor before anything appears. Abstracts are public so the work can be found; the papers themselves are free to registered readers. The aim is plain: a durable, citable home for careful work on a region that deserves more of it.",
    },
    // How a paper actually reaches a reader. Every line is a claim the code
    // and the editorial process can keep — an EDITOR reads submissions (this
    // is not peer review and must never be described as such), publication is
    // rolling, and nothing costs anything at any stage.
    process: [
      {
        title: "You send a paper",
        body: "A finished paper as a single PDF of up to 10 MB, with an abstract that stands alone. An account is free and a Google sign-in creates one.",
      },
      {
        title: "An editor reads it",
        body: "Every submission is read in full before anything appears on the site. You hear back by email either way; a returned paper comes with a note saying what to revise, and a revised version is welcome.",
      },
      {
        title: "It publishes, then binds",
        body: "Accepted papers go live as they clear review — the abstract public so the work can be found, the PDF free to registered readers — and are gathered into that quarter's issue.",
      },
    ],
    submissions: {
      title: "For contributors",
      body: "Send a finished paper as a single PDF of up to 10 MB, with an abstract that stands alone: the abstract is the only part of the paper search engines can read, so it should state the question, the method and the finding by itself.\n\nAn editor reads every submission in full, and you will hear back by email either way. If a paper is returned, the note explains what to revise, and a revised version is welcome. Publication is free at every stage.",
    },
  },
  submit: {
    intro: {
      title: "Submit a paper",
      body: "Anyone with an account may submit. An editor reads every submission in full before anything appears on the site, and you will be emailed when a decision is made.",
    },
  },
  footer: {
    credit:
      "An independent review of scholarship on the region, published by Freshman Academy.",
  },
} as const;
