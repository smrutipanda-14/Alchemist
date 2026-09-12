Features:
> Potion brewing rpg game where tasks provide xp and brewing materials
> Helping a person provides gold
> Gold buys profile themes and stickers
> Xp allows level up
> Daily streak increases the xp multiplier
> Daily tasks come from a pool and provide materials and xp
> Todo tasks provide xp

Flow:
1. Login:
	>JWT login
	>Token versioning	# so old jwts get invalidated
	>Password reset		# increases jwt version encoded into the token, invalidates old sessions
	>Email verification	# uses nodemailer and a google app password to allow the user to recieve reminders and codes for password resets
	
	Data schema: [username(string),password hash(string),creation date(datetime), userid(uuid-v4)<index>]
	Request Data:{username,password,email,pfp}

2. Main page:
	>User selects daily tasks from a list
	>User selects no. of daily tasks
	>User adds tasks for the day/week							# fixed xp rewards to prevent cheating ?
	>User dashboard shows the daily tasks and the todo tasks
	>User completes a task and submits proof					# sent to a queue for processing, user gets reward after processing
	>User gets materials in his game
	>User makes potions and sells them for gold
	>Users get rarer materials and progression rewards/badges from quest npcs
	>Garden for focus mode, Focus more to get more herbs
	
	User data schema: [userid(uuid-v4)<Foreign key><index>,daily task pool Indexes(int[]),today's daily task Indexes(int[]),today's completed daily tasks Indexes(int[]),badges(int[]),streak(int),profile picture path(string),banner path(string)]
	Game data schema: [userid(uuid-v4)<Foreign key><index>,items(int[]),xp(int),gold(int)]
	Itinerary schema: [userid(uuid-v4)<Foreign key><index>,todo task heading(string),time of completion(datetime)]
	Item list schema: [id(int),name(string),image path(string)]
	Badges db schema: [id(int),name(string),image path(string)]

3. Profile:
	>PFP
	>Banner		# customized with gold
	>Bio
	>Xp
	>Levels
	>Streak

4. Game tab:
	>Pokemon red style pixel rpg
	>Items and streak badges arrive in mail	# interact with mailbox to get
	>People arrive at the brewery and ask for potions, give them the potion and they give badges and rare herbs
	>garden allows to grow common herbs and occasionaly rare herbs # focus mode
	
	