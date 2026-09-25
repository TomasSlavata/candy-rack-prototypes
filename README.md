# Candy Rack Prototypes

Interactive prototypes for [Candy Rack](https://apps.shopify.com/candy-rack), built with real [Shopify Polaris](https://polaris-react.shopify.com/) components.

## Getting started

```bash
npm install   # once, after cloning
npm run dev   # starts a local server at http://localhost:5173
```

## Structure

```
shared/                  Code every prototype can use
  PrototypeShell.jsx     Polaris setup (AppProvider, Frame, styles)
  usePersistentState.js  useState that survives reloads (localStorage)
carousel-layout/         One folder = one prototype
  index.html
  main.jsx
index.html, index.jsx    Overview page listing all prototypes
```

## Adding a prototype

1. Create a branch: `git switch -c prototype/my-idea`
2. Copy an existing prototype folder, e.g. `cp -r carousel-layout my-idea`
3. Edit `my-idea/main.jsx` – it shows up on the overview page automatically
4. Commit, push, open a pull request
