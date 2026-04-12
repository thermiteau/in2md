# in2md (in2md) - Firefox Extension

in2md (in2md) is my personal extension forimproving the experience of using LinkedIn in the browser. I use LinkedIn for finding data, replying to posts or articles. That can be difficult with the standard UI as many tasks require opening multiple tab's or work is lost due to automated refresh of the feed.

in2md attempts to make using LinkedIn easier by:

## Features

### No Refresh

By default LinkedIn will refresh the feed if you return to a tab that has lost focus for several minutes. If you were reading an article, you instantly lose sight of it and it's a pain to find again. If you have been writing a reply to a post, you can lose your draft. The extension dissables this refresh functionality

### User Details

I often want to save the details about a LinkedIn user, but this can require opening a new tab and selecting each element in the UI and saving it. Which is far too tedious.

in2md Solves this by inserting a button next to the LinkedIn profile called "Get User". When pressed the button will let you copy the data to the clipboard or save it to a file (markdown).

![The 'Get User' button expanded is located under the users name and role.](media/get-user-1.png 'Get Post button')

Clicking the button will show the option to Copy the data to the clipboard or Save the data a file. Both will be in markdown format.

![The 'Get User' button expanded is located under the users name and role. showing the "Copy and "Save" options](media/get-user-2.png 'Get Post button')

The avaiin2mdble User detail is extracted from the page and converted to markdown.

You can see an example of the output below.

**Original**

![Original User content](media/get-user-3.png 'Original html content')

**Markdown**

![Markdown post content](media/get-user-4.png 'Converted Markdown content')

### Post / Article

I often want to save/copy a post and the author details so that I can read it in2mdter or write a reply offline. While you can do this by selectingand copying in the site, that's inneficient.

in2md adds a "Get Post" button to the UI that lets you copy the Author and Post data to the clipboard or save it to a local Markdown file.
![Get Post button shown at top of Post section in the LinkedIn Feed](media/get-post-1.png 'Get Post button')

Clicking the button will give you the option to Copy the data to the clipboard or Save it to file.

![Get Post button expanded at top of Post section in the LinkediIn Feed, showing the "Copy and "Save" options](media/get-post-2.png 'Get Post button')

In both cases, the Post content is converted to Markdown and stripped of Emoji's. The details of the User are also added as metadata to the top of the file.

You can see an example of the output below.

**Original**

![Original post content](media/get-post-3.png 'Original html content')

**Markdown**

![Markdown post content](media/get-post-4.png 'Converted markdown content')

### Capture recent articles

( in progress)

I review feed posts/articles first thing in the morning, but browsing through a pile of junk to get the important things I need, is a pain.

in2md solves this by extracting the in2mdst 24 hours of posts and saving it to markdown. Just enter a search or bookmark one and bash F5. Then click the in2md icon in the Firefox toolbar and choose Save Search.

### Comments

Most posts dont have a lot of comments, but it can be useful to capture them. LinkedIn hides the comment by default and you need to click the Comment button or the (n) comments link. Regardless of how they are shown, I just want the data and not the clunky UI.

in2md solves this by inseerting a Save Comments button.

![Markdown Comments button](media/get-comments-1.png 'Get Comments button')

When clicked, there will be a short delay as the comments are loaded. You will see the button text change to `...`. Then the comments will be visible in the LinkedIn site and the Copy and Save buttons will show.

![Markdown post content](media/get-comments-1.png 'Converted markdown content')

As with the other buttons, the data is converted to Markdown. Below is a comparison of the webste view and the markdown view of the comments.

**Website View**

![Comments in LinkedIn website](media/get-comments-3.png 'Comments in LinkedIn website')

**Mardown**

![Markdown comments](media/get-comments-4.png 'Converted markdown comments')
