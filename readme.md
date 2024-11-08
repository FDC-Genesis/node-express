# Instructions
## How to configure
1. git clone https://github.com/kiratrizon/node-express-mvc.git
2. cd node-express-mvc
3. npm install
4. rename .env.example into .env
5. node kira migrate
6. npm run devStart //for development

## Same Like Laravel Commands
### Create Model
-node kira make model Test <br>
A file will be created in libs/Model/Test.js

### Create Controller/ApiController
The entity allowed for now is
Admin, Developer, User <br>
-node kira make controller Test {Entity} <br>
A file will be created in app/{Entity}/Controller/TestController.js

-node kira make apicontroller Test {Entity} <br>
A file will be created in api/{Entity}/Controller/TestController.js

### Create View
-node kira make view Test {Entity} <br>
A file will be created in view/{Entity}/Test/index.ejs

### Create Migration
-node kira make migration test <br>
A file will be created in database/migrations/create_table_test.js

### Migrate
-node kira migrate

## Controller Rules
If you make TestController in Admin Entity
then the endpoint is <br>
/admin/test <br>
Kindly check the
config/auth.js <br>
you will see each entity's prefix <br>
since Admin's prefix by default is /admin <br>
while User's prefix by default is / <br>
if you have TestController in User's prefix
the endpoint will look like this <br>
/test

if your controller needs like return view(); <br>
from laravel you should do this instead <br>
<br>

Let's say this is from Admin's controller
you should just do this instead
<br>
this.render('index')
<br>
it will look for a view file from
<br>
view/Admin/Test/index.ejs

<br>
this.render('hello') <br>
will look for a view file from
<br>
view/Admin/Test/hello.ejs
<br>
It's because your controller name is TestController
<br><br>
Also you can use
<br>
this.set(key, value);
<br>
so that the key variable will join during rendering
no need to put
<br>
this.render('index', {data})

## Access the global files in config
it could be accessible both Model/Controller
using
<br>
this.config('auth'); // this will return the value of config/auth.js
<br>
this.config('auth.guards') // this will return the value of guards key in config/auth.js file

<br>
In view file you should just use config() function
