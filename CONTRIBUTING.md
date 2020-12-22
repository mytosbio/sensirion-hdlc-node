## Contributing

Hi there! We're thrilled that you'd like to contribute to this project. Your
help is essential for keeping it great.

Please note that this project is released with a [Contributor Code of
Conduct][code_of_conduct.md]. By participating in this project you agree to
abide by its terms.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Issues and PRs](#issues-and-prs)
- [Writing commit messages](#writing-commit-messages)
- [Submitting a pull request](#submitting-a-pull-request)
- [Resources](#resources)
- [Attribution](#attribution)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Issues and PRs

If you have suggestions for how this project could be improved, or want to
report a bug, open an issue! We'd love all and any contributions. If you have
questions, too, we'd love to hear them.

We'd also love PRs. If you're thinking of a large PR, we advise opening up an
issue first to talk about it, though! Look at the links below if you're not sure
how to open a PR.

## Writing commit messages

We follow the the
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) commit
specification. This helps us easily see the scope of a commit and flag where
there have been breaking changes introduced. When creating commits please aim to
adhere to the following:

- The first line of a commit message should be no more than 72 characters
- Commits should always contain a type and description
- Where possible commits should contain a body

## Submitting a pull request

1. Fork and clone the repository.
2. Configure and install the dependencies: `yarn install`.
3. Make sure you can build the typescript code `yarn run build`
4. Make sure you can lint the code `yarn run eslint .`
5. Make sure all the tests pass on your local device `yarn run test`
6. Create a new branch: `git checkout -b my-branch-name`.
7. Make your change, add tests, and make sure the tests still pass.
8. Push to your fork and submit a pull request.

Here are a few things you can do that will increase the likelihood of your pull
request being accepted:

- Follow the eslint rules and aim to not introduce new warnings.
- Write and update tests to ensure new features are well tested.
- Test your changes with a Sensirion sensor to see that it works on the physical
  device.
- Keep your changes as focused as possible. If there are multiple changes you
  would like to make that are not dependent upon each other, consider submitting
  them as separate pull requests.

Work in Progress pull requests are also welcome to get feedback early on, or if
there is something blocked you.

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)

## Attribution

This contributing document is based on
[probot/template/CONTRIBUTING.md](https://github.com/probot/template/blob/master/CONTRIBUTING.md)
