port module Main exposing (..)

import Html as Html exposing (..)
import Html.App as App exposing (program)
import Html.Attributes exposing (..)
import Html.Events exposing (..)


-- import Html.Keyed as Keyed

import Html.Lazy exposing (lazy)
import Http exposing (..)
import HttpBuilder exposing (..)
import Json.Encode as Encode exposing (..)
import Json.Decode exposing (..)
import Json.Decode.Pipeline exposing (decode, required, optional)
import String
import Task exposing (..)
import WebSocket


serverUrl : String
serverUrl =
    "http://localhost:8880"



-- model


type alias Model =
    { playlists : List Playlist
    , selectedPlaylist : Maybe Playlist
    , currentPlaytime : Float
    , paused : Bool
    , currentSong : String
    , addedSong : String
    , newPlaylist : NewPlaylist
    , modalShowing : Bool
    }


type alias Playlist =
    { title : String
    , category : String
    , password : String
    , openSubmissions : Bool
    , playlistType : PlaylistType
    , length : Int
    , currentTime : Float
    , isPaused : Bool
    , currentSongIndex : Int
    , songs : List Song
    , hasPlayed : Bool
    }


type alias NewPlaylist =
    { title : String
    , category : String
    , playlistType : PlaylistType
    , password : String
    , public : Bool
    }


type PlaylistType
    = Audio
    | Video


type alias Song =
    { info : String
    , isVideo : Bool
    , url : String
    , length : Float
    , streamUrl : String
    , expanded : Bool
    }


type alias NewSong =
    { playlist : String
    , url : String
    }


initialModel : ( Model, Cmd Action )
initialModel =
    ( { playlists = []
      , selectedPlaylist = Nothing
      , currentPlaytime = 0.0
      , paused = True
      , currentSong = ""
      , addedSong = ""
      , newPlaylist = NewPlaylist "" "" Audio "" True
      , modalShowing = False
      }
    , getPlaylists
    )



-- update


type Action
    = SocketMessage String
    | GetPlaylistsFail Http.Error
    | GetPlaylistsSuccess String
    | SelectPlaylist Playlist
    | TogglePlaylistForm
    | CreatePlaylist
    | UpdatePlaylistType PlaylistType
    | UpdatePlaylistTitle String
    | UpdatePlaylistCategory String
    | UpdatePlaylistPassword String
    | UpdatePlaylistPublicStatus
    | InputSong String
    | ToggleSongHidden Song
    | AddSong
    | NextSong
    | GoLive
    | Play
    | Pause
    | VolumeUp
    | VolumeDown
    | ReceiveMessage String
    | Rewind Float
    | Signout
    | AddSongFail Http.Error
    | AddSongSuccess Int
    | CreatePlaylistFail (HttpBuilder.Error String)
    | CreatePlaylistSuccess (HttpBuilder.Response String)



-- encodeNewPlaylist : NewPlaylist -> Json.Encode (List ( String, String ))


encodeNewPlaylist : NewPlaylist -> Encode.Value
encodeNewPlaylist playlist =
    let
        playlistType =
            case playlist.playlistType of
                Audio ->
                    "audio"

                Video ->
                    "video"
    in
        Encode.object
            [ ( "playlist", Encode.string playlist.title )
            , ( "category", Encode.string playlist.category )
            , ( "password", Encode.string playlist.password )
            , ( "type", Encode.string playlistType )
            , ( "openSubmissions", Encode.bool playlist.public )
            ]


createPlaylistRequest : Model -> Task (HttpBuilder.Error String) (HttpBuilder.Response String)
createPlaylistRequest model =
    HttpBuilder.post "http://localhost:8880/playlist/create"
        |> withJsonBody (encodeNewPlaylist model.newPlaylist)
        |> withHeader "Content-Type" "application/json"
        |> HttpBuilder.send (HttpBuilder.jsonReader Json.Decode.string) stringReader


getPlaylists : Cmd Action
getPlaylists =
    Task.perform
        GetPlaylistsFail
        GetPlaylistsSuccess
        (Http.getString (serverUrl ++ "/playlist"))


update : Action -> Model -> ( Model, Cmd Action )
update action model =
    case action of
        GetPlaylistsFail err ->
            let
                error =
                    Debug.log "err" err
            in
                ( model, Cmd.none )

        GetPlaylistsSuccess str ->
            let
                updatedPlaylists =
                    Json.Decode.decodeString playlistsDecoder str

                playlists =
                    case updatedPlaylists of
                        Ok list ->
                            List.map
                                (\playlist ->
                                    Playlist
                                        playlist.title
                                        playlist.category
                                        playlist.password
                                        playlist.openSubmissions
                                        (case playlist.playlistType of
                                            "audio" ->
                                                Audio

                                            "video" ->
                                                Video

                                            _ ->
                                                Audio
                                        )
                                        playlist.length
                                        playlist.currentTime
                                        playlist.isPaused
                                        playlist.currentSongIndex
                                        playlist.songs
                                        playlist.hasPlayed
                                )
                                list.playlists

                        Err err ->
                            []
            in
                ( { model | playlists = playlists }, Cmd.none )

        UpdatePlaylistType t ->
            let
                playlist =
                    model.newPlaylist

                updatedPlaylist =
                    { playlist | playlistType = t }
            in
                ( { model | newPlaylist = updatedPlaylist }, Cmd.none )

        UpdatePlaylistTitle title ->
            let
                playlist =
                    model.newPlaylist

                updatedPlaylist =
                    { playlist | title = title }
            in
                ( { model | newPlaylist = updatedPlaylist }, Cmd.none )

        UpdatePlaylistPassword pwd ->
            let
                playlist =
                    model.newPlaylist

                updatedPlaylist =
                    { playlist | password = pwd }
            in
                ( { model | newPlaylist = updatedPlaylist }, Cmd.none )

        UpdatePlaylistCategory cat ->
            let
                playlist =
                    model.newPlaylist

                updatedPlaylist =
                    { playlist | category = cat }
            in
                ( { model | newPlaylist = updatedPlaylist }, Cmd.none )

        UpdatePlaylistPublicStatus ->
            let
                playlist =
                    model.newPlaylist

                updatedPlaylist =
                    { playlist | public = not playlist.public }
            in
                ( { model | newPlaylist = updatedPlaylist }, Cmd.none )

        CreatePlaylist ->
            let
                newPlaylistRecord =
                    { title = model.newPlaylist.title
                    , category = model.newPlaylist.category
                    , playlistType =
                        case model.newPlaylist.playlistType of
                            Audio ->
                                "audio"

                            Video ->
                                "video"
                    , isPublic = model.newPlaylist.public
                    }

                msg =
                    Debug.log "record" (Http.string (toString newPlaylistRecord))
            in
                ( { model | newPlaylist = NewPlaylist "" "" Audio "" True }
                , (Task.perform
                    CreatePlaylistFail
                    CreatePlaylistSuccess
                    (createPlaylistRequest model)
                  )
                )

        CreatePlaylistFail err ->
            let
                msg =
                    Debug.log "err" (toString err)
            in
                ( model, Cmd.none )

        CreatePlaylistSuccess msg ->
            let
                message =
                    Debug.log "response" (toString msg)
            in
                ( model, Cmd.none )

        SelectPlaylist playlist ->
            case model.selectedPlaylist of
                Nothing ->
                    ( { model | selectedPlaylist = Just playlist }, Cmd.none )

                Just selectedPlaylist ->
                    if playlist == selectedPlaylist then
                        ( { model | selectedPlaylist = Nothing }, Cmd.none )
                    else
                        ( { model | selectedPlaylist = Just playlist }, Cmd.none )

        SocketMessage str ->
            let
                data =
                    Debug.log "data" str
            in
                ( model, Cmd.none )

        InputSong str ->
            ( { model | addedSong = str }, Cmd.none )

        TogglePlaylistForm ->
            ( { model | modalShowing = not model.modalShowing }, Cmd.none )

        AddSong ->
            if model.addedSong == "" then
                ( model, Cmd.none )
            else
                let
                    newSong =
                        Debug.log "test" model.addedSong
                in
                    case model.selectedPlaylist of
                        Just selectedPlaylist ->
                            ( { model | addedSong = "" }, (Task.perform AddSongFail AddSongSuccess (Http.post Json.Decode.int (serverUrl ++ "/song/new") (Http.string ("{ \"playlist\": \"" ++ selectedPlaylist.title ++ "\", \"songUrl\": \"" ++ newSong ++ "\"}")))) )

                        Nothing ->
                            ( model, Cmd.none )

        AddSongFail err ->
            ( model, Cmd.none )

        AddSongSuccess val ->
            let
                data =
                    Debug.log "response" val
            in
                ( model, Cmd.none )

        Play ->
            ( model, mediaMessage """{ "action": "play" }""" )

        Pause ->
            ( model, mediaMessage """{ "action": "pause" }""" )

        VolumeUp ->
            ( model, mediaMessage """{ "action": "volume-up" }""" )

        VolumeDown ->
            ( model, mediaMessage """{ "action": "volume-down" }""" )

        ReceiveMessage message ->
            let
                msg =
                    Json.Decode.decodeString audioDecoder message

                decoded =
                    Debug.log "message" msg
            in
                ( model, Cmd.none )

        _ ->
            ( model, Cmd.none )


type alias Message =
    { action : String, time : Float }


audioDecoder : Json.Decode.Decoder Message
audioDecoder =
    decode Message
        |> Json.Decode.Pipeline.required "action" Json.Decode.string
        |> Json.Decode.Pipeline.optional "time" Json.Decode.float -1.0


type alias PlaylistsRecord =
    { playlists : List PlaylistRecord }


playlistsDecoder : Decoder PlaylistsRecord
playlistsDecoder =
    decode PlaylistsRecord
        |> Json.Decode.Pipeline.required "playlists" (Json.Decode.list playlistDecoder)


type alias PlaylistRecord =
    { title : String
    , category : String
    , password : String
    , openSubmissions : Bool
    , playlistType : String
    , length : Int
    , currentTime : Float
    , isPaused : Bool
    , currentSongIndex : Int
    , hasPlayed : Bool
    , songs : List Song
    }


playlistDecoder : Decoder PlaylistRecord
playlistDecoder =
    decode PlaylistRecord
        |> Json.Decode.Pipeline.required "title" Json.Decode.string
        |> Json.Decode.Pipeline.required "category" Json.Decode.string
        |> Json.Decode.Pipeline.required "password" Json.Decode.string
        |> Json.Decode.Pipeline.required "openSubmissions" Json.Decode.bool
        |> Json.Decode.Pipeline.required "playlistType" Json.Decode.string
        |> Json.Decode.Pipeline.required "length" Json.Decode.int
        |> Json.Decode.Pipeline.required "currentTime" Json.Decode.float
        |> Json.Decode.Pipeline.required "isPaused" Json.Decode.bool
        |> Json.Decode.Pipeline.required "currentSongIndex" Json.Decode.int
        |> Json.Decode.Pipeline.required "hasPlayed" Json.Decode.bool
        |> Json.Decode.Pipeline.optional "songs" (Json.Decode.list songDecoder) []


type alias SongRecord =
    { info : String
    , isVideo : Bool
    , url : String
    , length : Float
    , streamUrl : String
    }


songDecoder : Decoder Song
songDecoder =
    decode Song
        |> Json.Decode.Pipeline.required "info" Json.Decode.string
        |> Json.Decode.Pipeline.required "isVideo" Json.Decode.bool
        |> Json.Decode.Pipeline.required "url" Json.Decode.string
        |> Json.Decode.Pipeline.required "length" Json.Decode.float
        |> Json.Decode.Pipeline.required "streamUrl" Json.Decode.string
        |> Json.Decode.Pipeline.optional "expanded" Json.Decode.bool False



-- type alias NewSong =
--     { action : String, object }
-- view


navbar : Html Action
navbar =
    node
        "navbar"
        [ class "navbar navbar-default navbar-fixed-top" ]
        [ div [ class "container-fluid" ]
            [ div [ class "navbar-header navbar-left" ]
                [ a [ class "navbar-brand", href "#" ] [ text "Playlistr" ]
                ]
            , div [ id "navbar", class "navbar-collapse collapse" ]
                [ ul [ class "nav navbar-nav navbar-right" ]
                    [ li [ class "dropdown" ]
                        [ a [ class "dropdown-toggle", href "#", attribute "data-toggle" "dropdown" ]
                            [ text "username"
                            , span [ class "caret" ] []
                            ]
                        , ul [ class "dropdown-menu" ]
                            [ li []
                                [ a [ href "/user" ] [ text "Profile" ]
                                , li [ class "divider" ] []
                                , li [] [ a [ onClick Signout ] [ text "Sign Out" ] ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]


addSongArea : Html Action
addSongArea =
    div [ class "input-group add-song-input" ]
        [ input [ class "form-control", type' "text", placeholder "Add song to current playlist", onInput InputSong ] []
        , span [ class "input-group-btn" ]
            [ button [ class "btn btn-default", onClick AddSong ] [ text "+" ]
            ]
        ]


audioPlayer : Model -> Html Action
audioPlayer model =
    div []
        [ audio [ id "media-player", hidden True, controls True, src "https://r4---sn-ab5l6nzd.googlevideo.com/videoplayback?lmt=1471262770994945&ipbits=0&ratebypass=yes&upn=S6kE45p-RQw&mime=video%2Fmp4&id=o-ACs5apOU6KVplfoQAuY4lZ0dwCKIfmOwvzbXoBxWDI0A&pl=16&ms=au&sparams=dur%2Cei%2Cgcr%2Cid%2Cinitcwndbps%2Cip%2Cipbits%2Citag%2Clmt%2Cmime%2Cmm%2Cmn%2Cms%2Cmv%2Cnh%2Cpl%2Cratebypass%2Crequiressl%2Csource%2Cupn%2Cexpire&mt=1474153301&mv=m&mm=31&ip=73.165.229.57&mn=sn-ab5l6nzd&key=yt6&expire=1474175360&itag=22&requiressl=yes&ei=IM3dV5nOJqO58gSq3J_QCA&gcr=us&dur=212.091&source=youtube&initcwndbps=1037500&nh=IgpwcjAxLmxnYTA3KgkxMjcuMC4wLjE&signature=54485FBA93EAA4CC49FEB30523EB5FAF7005BB04.356A3B829B82AC8BF5E0F4383858FA0B9380EB68" ] []
        , button [ onClick Play ] [ text "Play" ]
        , button [ onClick Pause ] [ text "Pause" ]
        , button [ onClick VolumeUp ] [ text "vol+" ]
        , button [ onClick VolumeDown ] [ text "vol-" ]
        ]


videoPlayer : Model -> Html Action
videoPlayer model =
    div []
        [ video [ id "media-player", hidden True, controls True, src "https://r4---sn-ab5l6nzd.googlevideo.com/videoplayback?lmt=1471262770994945&ipbits=0&ratebypass=yes&upn=S6kE45p-RQw&mime=video%2Fmp4&id=o-ACs5apOU6KVplfoQAuY4lZ0dwCKIfmOwvzbXoBxWDI0A&pl=16&ms=au&sparams=dur%2Cei%2Cgcr%2Cid%2Cinitcwndbps%2Cip%2Cipbits%2Citag%2Clmt%2Cmime%2Cmm%2Cmn%2Cms%2Cmv%2Cnh%2Cpl%2Cratebypass%2Crequiressl%2Csource%2Cupn%2Cexpire&mt=1474153301&mv=m&mm=31&ip=73.165.229.57&mn=sn-ab5l6nzd&key=yt6&expire=1474175360&itag=22&requiressl=yes&ei=IM3dV5nOJqO58gSq3J_QCA&gcr=us&dur=212.091&source=youtube&initcwndbps=1037500&nh=IgpwcjAxLmxnYTA3KgkxMjcuMC4wLjE&signature=54485FBA93EAA4CC49FEB30523EB5FAF7005BB04.356A3B829B82AC8BF5E0F4383858FA0B9380EB68" ] []
        , button [ onClick Play ] [ text "Play" ]
        , button [ onClick Pause ] [ text "Pause" ]
        , button [ onClick VolumeUp ] [ text "vol+" ]
        , button [ onClick VolumeDown ] [ text "vol-" ]
        ]


goLiveLink : Html Action
goLiveLink =
    button [ class "btn btn-default", onClick GoLive ] [ text "Go Live" ]


exportPlaylistLink : Model -> Html Action
exportPlaylistLink model =
    let
        songUrls =
            case model.selectedPlaylist of
                Nothing ->
                    ""

                Just selectedPlaylist ->
                    if List.length selectedPlaylist.songs > 0 then
                        String.join "," (List.map (\song -> song.url) selectedPlaylist.songs)
                    else
                        ""
    in
        if songUrls == "" then
            div [] []
        else
            a [ href ("http://youtube.com/watch_videos?video_ids=" ++ songUrls), target "_blank" ]
                [ span [ class "glyphicon glyphicon-export" ] []
                ]


myButton : Html Action
myButton =
    div [] []


playlist : String -> Playlist -> Html Action
playlist selectedPlaylist playlist =
    let
        selected =
            if playlist.title == selectedPlaylist then
                "selected"
            else
                ""

        glyphicon =
            case playlist.playlistType of
                Audio ->
                    "glyphicon-music"

                Video ->
                    "glyphicon-film"
    in
        button [ class "list-group-item playlist-selector pull-left", id playlist.title, type' "button", onClick (SelectPlaylist playlist) ]
            [ text playlist.title
            , span [ class ("pull-right glyphicon " ++ glyphicon ++ " playlist-span " ++ selected) ] []
            ]


playlistCreator : Model -> Html Action
playlistCreator model =
    div [ class "playlist-modal" ]
        [ button [ class "btn btn-primary show-playlist-form", onClick TogglePlaylistForm ] [ text "New Playlist" ]
        , if model.modalShowing then
            lazy playlistForm model
          else
            div [] []
        ]


playlistForm : Model -> Html Action
playlistForm model =
    div [ class "playlist-form" ]
        [ i [ class "glyphicon glyphicon-remove pull-right close-playlist-form", onClick TogglePlaylistForm ] []
        , h3 [ class "playlist-form-header" ] [ text "Create playlist" ]
        , div [ class "form-group" ]
            [ input [ type' "text", class "form-control", placeholder "Playlist title", onInput UpdatePlaylistTitle ] []
            , input [ type' "text", class "form-control", placeholder "Playlist category", onInput UpdatePlaylistCategory ] []
            ]
        , input [ type' "text", class "form-control", placeholder "Password (leave blank for none)", onInput UpdatePlaylistPassword ] []
        , div
            [ class "checkbox" ]
            [ label [ class "radio-inline" ]
                [ input [ type' "checkbox", checked model.newPlaylist.public, onClick UpdatePlaylistPublicStatus ] []
                , text "Public submissions"
                ]
            ]
        , div [ class "type-radio" ]
            [ label [ class "radio-inline" ]
                [ input [ type' "radio", name "type", checked (model.newPlaylist.playlistType == Audio), onClick (UpdatePlaylistType Audio) ] []
                , text "Music"
                ]
            , label [ class "radio-inline" ]
                [ input [ type' "radio", name "type", checked (model.newPlaylist.playlistType == Video), onClick (UpdatePlaylistType Video) ] []
                , text "Video"
                ]
            ]
        , button [ type' "submit", class "btn btn-primary create-playlist-button", id "create_playist", onClick CreatePlaylist ] [ text "Create" ]
        , div [ class "clearfix" ] []
        ]


playlistSidebar : Model -> Html Action
playlistSidebar model =
    case List.length model.playlists of
        0 ->
            div [ class "panel panel-default" ]
                [ div [ class "panel-body" ]
                    [ lazy playlistCreator model
                    , text "There's nothing here yet"
                    ]
                ]

        _ ->
            let
                lazyModal =
                    (lazy
                        playlistCreator
                        model
                    )

                playlists =
                    case model.selectedPlaylist of
                        Nothing ->
                            (List.map
                                (\pl ->
                                    playlist "" pl
                                )
                                model.playlists
                            )

                        Just selectedPlaylist ->
                            (List.map
                                (\pl ->
                                    playlist selectedPlaylist.title pl
                                )
                                model.playlists
                            )

                children =
                    lazyModal :: playlists
            in
                div [ class "panel panel-default" ]
                    [ div [ class "panel-body" ]
                        children
                    ]


songArea : Model -> Html Action
songArea model =
    case model.selectedPlaylist of
        Nothing ->
            div [] []

        Just selectedPlaylist ->
            if List.length selectedPlaylist.songs > 0 then
                div []
                    (List.map
                        (\song ->
                            songEntry song
                        )
                        selectedPlaylist.songs
                    )
            else
                div []
                    [ h2 [] [ text selectedPlaylist.title ]
                    , div [ class "well well-sm" ]
                        [ h4 [] [ text "There's nothing here.  Add songs to this playlist above." ]
                        ]
                    ]


songEntry : Song -> Html Action
songEntry song =
    let
        playingIcon =
            div [] []

        extraInfo =
            if song.expanded then
                ul [ class "list-group" ]
                    [ li [ class "list-group-item" ]
                        [ span [ class "pull-right" ] [ text (toString song.length) ]
                        , div [ class "clearfix" ] []
                        ]
                    ]
            else
                div [] []
    in
        div [ class "panel panel-default" ]
            [ div [ class "panel-heading", onClick (ToggleSongHidden song) ]
                [ h4 [ class "panel-title pull-left" ] [ text song.info ]
                ]
            , playingIcon
            , div [ class "clearfix" ] []
            , extraInfo
            ]


contentSection : Model -> Html Action
contentSection model =
    case model.selectedPlaylist of
        Nothing ->
            div [] []

        Just selectedPlaylist ->
            if List.length selectedPlaylist.songs > 0 then
                case selectedPlaylist.playlistType of
                    Audio ->
                        div []
                            [ audioPlayer model
                            , songArea model
                            ]

                    Video ->
                        div []
                            [ videoPlayer model
                            , songArea model
                            ]
            else
                div [] []


view : Model -> Html Action
view model =
    div []
        [ div [ id "top-section" ]
            [ navbar
            , div [ class "row" ]
                [ div [ class "col-md-3" ] [ addSongArea ]
                , div [ class "col-md-6" ] [ (lazy audioPlayer model) ]
                ]
            , div [ class "row" ]
                [ div [ class "col-md-3 sidebar-col" ] [ (lazy playlistSidebar model) ]
                , div [ class "col-md-9" ]
                    [ div [ id "playlist_area" ]
                        [ div [ class "row" ]
                            [ div [ class "pull-left" ] [ goLiveLink ]
                            , div [ class "pull-right" ] [ exportPlaylistLink model ]
                            ]
                        , div [ class "clearfix" ] []
                        , (lazy contentSection model)
                        ]
                    ]
                ]
            ]
        ]


subscriptions : Model -> Sub Action
subscriptions model =
    Sub.batch
        [ WebSocket.listen socketServer SocketMessage
        , sendMessage ReceiveMessage
        ]


port mediaMessage : String -> Cmd msg


port sendMessage : (String -> msg) -> Sub msg



--SocketMessage


socketServer : String
socketServer =
    "ws://localhost:8880/playlist/socket"


main : Program Never
main =
    App.program
        { init = initialModel
        , update = update
        , view = view
        , subscriptions = subscriptions
        }
