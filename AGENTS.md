<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep protected pages as named children of the integration-managed `_authenticated/route.tsx` layout; a childless pathless layout conflicts with the public home route.
- Mount the shared school authentication provider inside the root QueryClientProvider so sign-in, account navigation and sign-out use one session listener.
- Store reusable school identity and academic catalogue data in the central school configuration so public pages remain consistent when school details change.
- The public '/' route is a sign-up/log-in welcome gate; the full homepage lives at the protected named route /home so it never conflicts with '/'.
