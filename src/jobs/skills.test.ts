import { describe, expect, it } from 'vitest'
import { canonicalSkill, extractSkills, knownSkills } from './skills'

describe('canonicalSkill', () => {
  it('maps aliases to one canonical name, ignoring case and spacing', () => {
    expect(canonicalSkill('JS')).toBe('javascript')
    expect(canonicalSkill('ts')).toBe('typescript')
    expect(canonicalSkill('NodeJS')).toBe('node.js')
    expect(canonicalSkill('node')).toBe('node.js')
    expect(canonicalSkill('  Postgres ')).toBe('postgresql')
    expect(canonicalSkill('psql')).toBe('postgresql')
    expect(canonicalSkill('K8s')).toBe('kubernetes')
    expect(canonicalSkill('ML')).toBe('machine learning')
    expect(canonicalSkill('reactjs')).toBe('react')
    expect(canonicalSkill('nextjs')).toBe('next.js')
    expect(canonicalSkill('golang')).toBe('go')
    expect(canonicalSkill('Go')).toBe('go')
    expect(canonicalSkill('cpp')).toBe('c++')
    expect(canonicalSkill('C#')).toBe('c#')
    expect(canonicalSkill('RESTful')).toBe('rest')
    expect(canonicalSkill('rest')).toBe('rest')
    expect(canonicalSkill('sklearn')).toBe('scikit-learn')
    expect(canonicalSkill('Scikit Learn')).toBe('scikit-learn')
  })

  it('keeps profile words that are not in the dictionary, tidied', () => {
    expect(canonicalSkill('  Quantum   Computing ')).toBe('quantum computing')
    expect(canonicalSkill('voice')).toBe('voice ai')
    expect(canonicalSkill('speech')).toBe('speech recognition')
  })

  it('is stable: canonicalising a canonical name changes nothing', () => {
    for (const { name } of knownSkills()) expect(canonicalSkill(name)).toBe(name)
  })
})

describe('dictionary', () => {
  it('is a sensible size with unique names', () => {
    const names = knownSkills().map((s) => s.name)
    expect(names.length).toBeGreaterThanOrEqual(150)
    expect(names.length).toBeLessThanOrEqual(260)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('extractSkills', () => {
  it('finds skills in order of first appearance, deduped', () => {
    expect(extractSkills('We use Python and React. Python is everywhere; PostgreSQL too.')).toEqual([
      'python',
      'react',
      'postgresql',
    ])
  })

  it('returns nothing for empty or skill-free text', () => {
    expect(extractSkills('')).toEqual([])
    expect(extractSkills('Join a friendly team that values curiosity and ownership.')).toEqual([])
  })

  it('handles symbols: c++, c#, .net, node.js, ci/cd', () => {
    expect(extractSkills('C++, C# and .NET experience; Node.js a plus. CI/CD pipelines.')).toEqual([
      'c++',
      'c#',
      '.net',
      'node.js',
      'ci/cd',
    ])
    expect(extractSkills('Proficiency in C++.')).toEqual(['c++'])
    expect(extractSkills('Build services with ASP.NET Core and C#.')).toEqual(['.net', 'c#'])
    expect(extractSkills('Backend in Node.js.')).toEqual(['node.js'])
  })

  it('recognises aliases and spelling variants', () => {
    expect(extractSkills('JS, TS, k8s, Postgres, ReactJS, NextJS, golang, cpp')).toEqual([
      'javascript',
      'typescript',
      'kubernetes',
      'postgresql',
      'react',
      'next.js',
      'go',
      'c++',
    ])
    expect(extractSkills('scikit learn and scikit-learn and sklearn')).toEqual(['scikit-learn'])
    expect(extractSkills('Built RESTful APIs and REST APIs')).toEqual(['rest'])
    expect(extractSkills('React Native apps in react-native')).toEqual(['react native'])
  })

  it('does not confuse similar names', () => {
    expect(extractSkills('JavaScript developer')).toEqual(['javascript'])
    expect(extractSkills('Java developer')).toEqual(['java'])
    expect(extractSkills('MySQL and NoSQL')).toEqual(['mysql', 'nosql'])
    expect(extractSkills('Hosted on GitHub')).toEqual(['github'])
    expect(extractSkills('React Native')).toEqual(['react native'])
    expect(extractSkills('Android Kotlin')).toEqual(['android', 'kotlin'])
    expect(extractSkills('Objective-C and Swift/SwiftUI')).toEqual(['objective-c', 'swift', 'swiftui'])
  })

  it('does not match inside other words or addresses', () => {
    expect(extractSkills('Visit example.net. Scalable, rusty, javanese cuisine, gopher.')).toEqual([])
    expect(extractSkills('Catalogue, pandemic, expository')).toEqual([])
  })

  describe('English words that are also skills', () => {
    it('ignores "go" in prose', () => {
      expect(extractSkills('Go beyond expectations and go to market fast. Let us go!')).toEqual([])
      expect(extractSkills("Go-getter with a go-to-market mindset. It's a go.")).toEqual([])
      expect(extractSkills('You will go and talk to users. Ready, set, Go!')).toEqual([])
    })

    it('matches Go in clear tech context', () => {
      expect(extractSkills('Python, Go, Java')).toEqual(['python', 'go', 'java'])
      expect(extractSkills('Experience in Go and Rust')).toEqual(['go', 'rust'])
      expect(extractSkills('Backend services written in Go.')).toEqual(['go'])
      expect(extractSkills('Golang or Go programming')).toEqual(['go'])
      expect(extractSkills('Go/Python tooling')).toEqual(['go', 'python'])
      expect(extractSkills('Tooling: Rust/Go/Python')).toEqual(['rust', 'go', 'python'])
    })

    it('ignores "rest" in prose but keeps REST', () => {
      expect(extractSkills('Take the rest of the day. Rest assured. The rest is history.')).toEqual([])
      expect(extractSkills('Design REST APIs, REST, and rest api clients')).toEqual(['rest'])
      expect(extractSkills('Know HTTP, REST, gRPC')).toEqual(['rest', 'grpc'])
      expect(extractSkills('RESTful services')).toEqual(['rest'])
    })

    it('ignores "spark" and "swift" in prose', () => {
      expect(extractSkills('Spark curiosity. A spark of joy. Swift response times and swift decisions.')).toEqual([])
      expect(extractSkills('A swift, decisive team that is quick to react.')).toEqual([])
      expect(extractSkills('Spark your career with us')).toEqual([])
    })

    it('matches Spark and Swift in tech context', () => {
      expect(extractSkills('Hadoop, Spark, Kafka')).toEqual(['hadoop', 'spark', 'kafka'])
      expect(extractSkills('Apache Spark and PySpark jobs')).toEqual(['spark'])
      expect(extractSkills('iOS (Swift)')).toEqual(['ios', 'swift'])
      expect(extractSkills('Kotlin or Swift')).toEqual(['kotlin', 'swift'])
      expect(extractSkills('Experience with Swift programming')).toEqual(['swift'])
    })

    it('ignores other ambiguous words in prose', () => {
      expect(extractSkills('Express interest. We react quickly. Spring is busy. Rails and fences.')).toEqual([])
      expect(extractSkills('Vitamin C, R&D, C-suite, tree node, a trade expo, Unity of purpose.')).toEqual([])
      expect(extractSkills('Bootstrap the team. At the helm. Remix the song.')).toEqual([])
      expect(extractSkills('React to change. Transformers is a movie. Optimus Prime.')).toEqual([])
    })

    it('matches those words in tech context', () => {
      expect(extractSkills('Node, Express, MongoDB')).toEqual(['node.js', 'express', 'mongodb'])
      expect(extractSkills('Frontend: React, Vue, Angular')).toEqual(['react', 'vue', 'angular'])
      expect(extractSkills('Java, Spring Boot')).toEqual(['java', 'spring'])
      expect(extractSkills('Languages: C, C++, R')).toEqual(['c', 'c++', 'r'])
      expect(extractSkills('Mobile apps with Expo and React Native')).toEqual(['expo', 'react native'])
      expect(extractSkills('Ruby on Rails')).toEqual(['ruby', 'rails'])
    })
  })

  it('treats acronyms case-sensitively', () => {
    expect(extractSkills('AI/ML engineer; RAG pipelines')).toEqual([
      'artificial intelligence',
      'machine learning',
      'rag',
    ])
    expect(extractSkills('Add 5 ml of water, said the ai? A rag doll.')).toEqual([])
  })

  it('covers ML, data and cloud vocabulary', () => {
    expect(
      extractSkills(
        'Experience with PyTorch or TensorFlow, large language models, retrieval-augmented generation is not listed but RAG is. Docker, AWS and Kubernetes.',
      ),
    ).toEqual(['pytorch', 'tensorflow', 'llm', 'rag', 'docker', 'aws', 'kubernetes'])
  })

  it('works on a realistic posting', () => {
    const text = `Software Engineer, New Grad (2027)
      About the role: You will build backend services in Python and Go, deploy them with Docker on AWS,
      and work with PostgreSQL and Redis. Familiarity with REST APIs, Git and CI/CD is expected.
      Nice to have: React, TypeScript, or experience with LLMs. We value data structures and algorithms.
      Join us for the rest of your career. Go beyond what is asked.`
    expect(extractSkills(text)).toEqual([
      'python',
      'go',
      'docker',
      'aws',
      'postgresql',
      'redis',
      'rest',
      'git',
      'ci/cd',
      'react',
      'typescript',
      'llm',
      'data structures',
      'algorithms',
    ])
  })

  it('is fast enough on a long description', () => {
    const long = 'We build great products with care and curiosity. '.repeat(400) + 'Python, SQL'
    const t = Date.now()
    expect(extractSkills(long)).toEqual(['python', 'sql'])
    expect(Date.now() - t).toBeLessThan(500)
  })
})
