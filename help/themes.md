# Settings for themes
In settings for BRAT, you can delete any registered beta themes.


# Boring details about themes that are useful to know
## Versioning
One goal of BRAT is to make installing and updating themes that you want to test very easy to do.  

BRAT looks at the commit date on the themes.css file in the Github repository. If the commit date is greater than the date of the locally installed file it will download the updated and replace the local copy. While this works well, its not guaranted to work. 

## How BRAT saves theme files to the vault
BRAT downloads the theme.css and manifest.json files from the Github repository and saves tgen to your themes folder in the vault. 


## Deleting of "BRAT-" beta themes
When a theme is deleted from the list of beta themese in the Settings form, the theme.css and manifest.json are not deleted from the vault. The user can delete the theme from Settings > Appearance. BRAT will no longer monitor updates to the theme.
