## 01 Get Started with JavaScript and Node.js

In this article we are going to learn how to install JavaScript, obtain libraries to host websites and serve web pages and build a server which receives images and shares them on the web. 
## Install Node.js so you can run JavaScript
The first thing you need to do is install the Node.js environment. We want the latest version, so we are going to use the node version manager to do this. Open up a command window and execute the following command:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```
![Screenshot of nodevm being instaled](/images/Node%20Install%2001%20nvm.png)

This adds the command nvm to your console, but you need to close and open the console window to pick up the new command. Then you can enter the followint

```
nvm install node
```

![Screenshot of node.js being instaled](/images/Node%20Install%2002%20node.png)

You can make sure that node is available, and check the version that you have got by using the following command:

```
node --version
```

![Screenshot of node.js version](/images/Node%20Install%2003%20version.png)

Version 26 is a good one to be going on with. Now that we have node installed we can have a little chat with it

![Screenshot of node.js session](/images/Node%20Install%2004%20chat.png)

The command **node** starts the Node.js **REPL**. REPL stands for Read, Evaluate, Print and Loop. This reads a JavaScript statement from the terminal, executes it, prints whatever the statement returned and then loops around for the next one. So, if we type **2+2** JavaScript will do the sums and return the value 4. If we type **console.log("hello world")** JavaScript will run the **log** method on the console object, passing it the string **"hello world"**. The **log** method prints the argument it has been given (in this case the string) and then returns the value **undefined** which is displayed. To exit from REPL you give the aptly named .exit command (note the dot in front of the word).


[home](/README.md)