node topview.js $1 $2 $3 $4 >/dev/null 2>&1; python3 -c "
from PIL import Image;im=Image.open('$4.ppm');im=im.resize((im.width*$5,im.height*$5),Image.NEAREST);im.save('$4.png')"
