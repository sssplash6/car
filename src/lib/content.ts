// Site copy, in one place.
//
// Plain constants, deliberately. There is no database table and no admin editor
// behind this: copy changes ship as code, which for a publication of this size is
// simpler than maintaining a CMS surface nobody asked for.
//
// Every value below is a PLACEHOLDER awaiting real editorial text. They are
// written to read as obviously provisional rather than convincingly final, so
// nothing here gets mistaken for approved copy. Replace them in place.

export const COPY = {
  home: {
    hero: {
      // Kept to 13 words: the hero has to fit the viewport, and a long subhead is
      // a font-scale problem rather than a copy-length one.
      title: "Research on Central Asia",
      body: "Peer-reviewed papers and analysis on the politics, economies and societies of the region.",
    },
    editorial: {
      title: "From the editors",
      body: "A standing note from the editorial team belongs here: what the review is for, what it looks for in a submission, and how often new work appears. Placeholder copy.",
    },
    callForPapers: {
      title: "Call for submissions",
      body: "We read submissions year-round from researchers, practitioners and graduate students working on the region. Placeholder copy: replace with real scope, length and deadline guidance.",
    },
  },
  about: {
    main: {
      title: "About the Review",
      body: "Central Asian Review publishes research on Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan and Uzbekistan, alongside the wider region.\n\nThis is placeholder text. Replace it with the real account of the review's history, editorial stance and scope.",
    },
    masthead: {
      title: "Masthead",
      body: "Editor-in-Chief: Name Placeholder\nManaging Editor: Name Placeholder\nEditorial Board: Name, Name, Name\n\nPlaceholder list. Replace with the real masthead.",
    },
    submissions: {
      title: "For contributors",
      body: "An editor reviews every submission before publication. Abstracts appear publicly; the full paper is available to registered readers.\n\nPlaceholder copy: replace with real formatting requirements, word limits and review timelines.",
    },
  },
  submit: {
    intro: {
      title: "Submit a paper",
      body: "Anyone with an account may submit. An editor reads every submission before it appears on the site. Placeholder guidance: replace with the real submission requirements.",
    },
  },
  footer: {
    credit:
      "An independent review of scholarship on the region, published by Freshman Academy.",
  },
} as const;
