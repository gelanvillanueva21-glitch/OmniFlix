# OmniFlix Hero Background Images

This directory is reserved for optional background artwork displayed around the edges of the desktop hero section.

## How to add images:

1. Add your artwork files here, for example:
   - `left-top.jpg`
   - `left-bottom.jpg`
   - `right-top.jpg`
   - `right-bottom.jpg`

2. Open `components/landing/HeroBackground.tsx`.
3. In the `ARTWORK_SLOTS` array, set the `src` property to the image path:
   ```ts
   {
       id: "left-top",
       src: "/images/hero/left-top.jpg",
       alt: "Comics artwork",
       positionClasses: "top-[12%] -left-12 w-64 h-88 xl:w-72 xl:h-96",
       rotationClasses: "-rotate-6",
   }
   ```
4. If no images are specified (`src: undefined`), the page renders the clean charcoal-black background with subtle ambient gradients.

