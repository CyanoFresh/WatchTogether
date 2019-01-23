Watch video together
===

App for watching video simultaneously with other users by
synchronizing time bar.

Built on websockets and video.js

## Websocket actions

### Time

Is sent when one user changes current time by a time bar.

```json
{
"type": "time",
"time": 67
}
```

`time` in seconds from the start (67 = 01:07)

### Pause

Is sent to all when user pauses video by a controls


```json
{
"type": "pause",
"time": 67
}
```

Clients should change to the given value and pause playing.

### Play

Is sent to all when user starts playing video by a controls

```json
{
"type": "play",
"time": 67
}
```

Clients should change time to the given value and 
start playing.
