# Settings for themes
In settings for BRAT, you can delete any registered beta themes.


# Boring details about themes that are useful to know
## Versioning
One goal of BRAT is to make installing and updating themes that you want to test very easy to do.  

BRAT looks at the commit date on the themes.css file in the Github repository. If the commit date is greater than the date of the locally installed file it will download the updated and replace the local copy. While this works well, its not guaranted to work. 

## How BRAT saves theme files to the vault
BRAT downloads the theme.css and manifest.json files from the Github repository and saves tgen to your themes folder in the vault. 

## theme.css or theme-beta.css
A theme file that is downloaded and installed to your vault has the name theme.css. BRAT will look at a repository for the file named theme.css, just as Obsidian does when download themes. However, BRAT first looks for a filee called **theme-beta.css**. If theme-beta.css exists, it is downloaded and installed as a theme. What does this mean? A theme developer has two options when using BRAT.

+ Option 1 - in the repo, have a file called theme.css and BRAT will download that for beta testing.

+ Option 2 - in the repo, have a file called theme-beta.css and BRAT will download that for beta testing. In this case, if there is also a file called theme.css, BRAT will ignore that file and instead use the theme-beta.css file. This allows the theme developer to have a shipping theme.css file for the general public, and at the same time have a theme that is being tested. When the testing ends, the theme developer simply removes the theme-beta.css file, and updates theme.css with all the changes ready for the general public. Please note, if theme-beta.css exists, theme.css is ignored. A theme developer has to manage this scenario so that beta testers are not left with an out of date theme-beta.css file.

## Deleting beta themes
When a theme is deleted from the list of beta themese in the BRAT Settings form, the theme.css and manifest.json are not deleted from the vault. The user can delete the theme from Settings > Appearance. BRAT will no longer monitor updates to the theme.
