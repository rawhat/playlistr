module Views exposing (..)

import Css
    exposing
        ( absolute
        , asPairs
        , backgroundColor
        , borderRadius
        , marginLeft
        , marginRight
        , marginTop
        , paddingBottom
        , paddingRight
        , pct
        , position
        , px
        , relative
        , right
        , top
        )
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick, onInput, onWithOptions)
import Json.Decode as Json
import Models exposing (Model, Playlist, PlaylistCategories, PlaylistCreateModal, Playlists)
import Msgs exposing (Msg)
import RemoteData exposing (WebData)


styles : List Css.Style -> Attribute msg
styles =
    Css.asPairs >> Html.Attributes.style


mainView : Model -> Html Msg
mainView model =
    div []
        [ navBar model
        , div [ id "top-section" ]
            [ div [ styles [ marginTop (px 60) ] ]
                [ div [ class "row middle-section" ]
                    [ div [ class "col-md-2 col-sm-12" ]
                        [ div [ class "row" ]
                            [ addSongArea model ]
                        , div [ class "row" ]
                            [ playlistSidebar model ]
                        ]
                    , div [ class "col-md-10 col-sm-12" ]
                        [ div [ class "row" ]
                            [ mediaBar model ]
                        , div [ class "row" ]
                            [ div [ id "playlist_area", styles [ marginRight (px 50) ] ]
                                [ div
                                    [ class "row"
                                    , styles
                                        [ marginLeft (px 50)
                                        , marginRight (px 50)
                                        , paddingBottom (px 10)
                                        ]
                                    ]
                                    [ div [ class "pull-left" ] [ goLiveLink model.selectedPlaylist ]
                                    , div [ class "pull-right" ] [ exportPlaylistLink ]
                                    ]
                                , contentSection model
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        , createPlaylistModal model.modalShowing model.createModal
        ]


navBar : Model -> Html msg
navBar model =
    let
        userSection =
            case model.username of
                Just username ->
                    text username

                Nothing ->
                    text ""
    in
    nav [ class "navbar navbar-default navbar-fixed-top " ]
        [ div [ class "container-fluid" ]
            [ div [ class "navbar-header" ]
                [ div [ class "navbar-brand" ]
                    [ a [ href "/" ] [ text "Playlistr" ]
                    , userSection
                    ]
                ]
            ]
        ]


playlistList : WebData Playlists -> String -> String -> Html Msg
playlistList response selectedPlaylist categoryFilter =
    case response of
        RemoteData.NotAsked ->
            text ""

        RemoteData.Loading ->
            text "Loading..."

        RemoteData.Success playlists ->
            let
                content =
                    if List.length playlists.playlists == 0 then
                        [ div [ class "panel panel-default" ]
                            [ div [ class "panel-body" ]
                                [ text "There's nothing here yet" ]
                            ]
                        ]
                    else
                        let
                            filteredPlaylists =
                                case categoryFilter of
                                    "All" ->
                                        playlists.playlists

                                    filter ->
                                        List.filter
                                            (\playlist ->
                                                playlist.category == filter
                                            )
                                            playlists.playlists
                        in
                        List.map
                            (\playlist ->
                                playlistEntry playlist (playlist.title == selectedPlaylist)
                            )
                            filteredPlaylists
            in
            ul [ class "list-group" ] content

        RemoteData.Failure error ->
            text "Error loading playlists."


playlistSidebar : Model -> Html Msg
playlistSidebar model =
    div []
        [ playlistCreator model
        , playlistCategoryFilter model.playlistCategories
        , playlistList model.playlists model.selectedPlaylist model.playlistCategoryFilter
        ]


playlistCategoryFilter : WebData PlaylistCategories -> Html Msg
playlistCategoryFilter filters =
    case filters of
        RemoteData.Success playlistCategories ->
            select [ class "form-control", onInput Msgs.ChangePlaylistFilter ]
                (List.map
                    (\opt ->
                        option [] [ text opt ]
                    )
                    ([ "All" ] ++ playlistCategories.categories)
                )

        _ ->
            text ""


playlistCreator : Model -> Html Msg
playlistCreator model =
    button
        [ class "btn btn-primary"
        , onClick Msgs.ShowModal
        , styles [ Css.width (pct 80), Css.left (pct 10), position relative, Css.marginBottom (px 10) ]
        ]
        [ text "Create Playlist" ]


createPlaylistModal : Bool -> PlaylistCreateModal -> Html Msg
createPlaylistModal showing model =
    let
        modal =
            if showing then
                playlistModal model
            else
                text ""
    in
    modal


playlistModal : PlaylistCreateModal -> Html Msg
playlistModal modal =
    div [ class "create-playlist-modal", onClick Msgs.HideModal ]
        [ div [ class "modal-body", onWithOptions "click" { stopPropagation = True, preventDefault = False } (Json.succeed Msgs.NoOp) ]
            [ div [ class "panel panel-default" ]
                [ div [ class "panel-heading" ]
                    [ h3 [ class "pull-left" ] [ text "New Playlist" ]
                    , span [ class "glyphicon glyphicon-remove pull-right", onClick Msgs.HideModal, styles [ Css.cursor Css.pointer, Css.fontSize (px 28), marginTop (px 20) ] ] []
                    , div [ class "clearfix" ] []
                    ]
                , div [ class "panel-body" ]
                    [ Html.form []
                        [ div [ class "form-group" ] [ input [ class "form-control" ] [] ]
                        , div [ class "form-group" ] [ input [ class "form-control" ] [] ]
                        , div [ class "form-group" ] [ input [ class "form-control" ] [] ]
                        , div [ class "form-group" ]
                            [ div [ class "radio" ]
                                [ label []
                                    [ span [ styles [ marginRight (px 30) ] ] [ text "Music" ]
                                    , input [ type_ "radio", name "playlistType" ] []
                                    ]
                                ]
                            , div [ class "radio" ]
                                [ label []
                                    [ span [ styles [ marginRight (px 30) ] ] [ text "Video" ]
                                    , input [ type_ "radio", name "playlistType" ] []
                                    ]
                                ]
                            ]
                        , div [ class "form-group" ]
                            [ input [ type_ "checkbox", class "form-control" ] [] ]
                        ]
                    ]
                ]
            ]
        ]


playlistEntry : Playlist -> Bool -> Html Msg
playlistEntry playlist selected =
    let
        buttonStyle =
            if selected then
                [ styles [ backgroundColor (Css.hex "375a7f") ] ]
            else
                []

        passwordIcon =
            if playlist.hasPassword then
                span [ class "glyphicon glyphicon-lock", styles [ paddingRight (px 5) ] ] []
            else
                text ""
    in
    button
        (buttonStyle
            ++ [ type_ "button"
               , class "list-group-item playlist-selector"
               , id playlist.title
               , onClick (Msgs.StartFetchPlaylist playlist.title)
               ]
        )
        [ text playlist.title
        , div [ class "pull-right" ] [ passwordIcon ]
        ]


addSongArea : Model -> Html Msg
addSongArea model =
    div [ class "form-group" ]
        [ div [ class "input-group" ]
            [ input
                [ class "form-control"
                , type_ "text"
                , placeholder "Add song to current playlist"
                , onInput Msgs.ChangeSongUrl
                , value model.addSongUrl
                ]
                []
            , div [ class "input-group-btn" ]
                [ button [ class "btn btn-default", onClick Msgs.AddSongUrl ] [ text "+" ] ]
            ]
        ]


mediaBar : Model -> Html Msg
mediaBar model =
    case model.currentPlaylist of
        RemoteData.Success playlist ->
            if playlist.type_ == "music" then
                customAudioBar model
            else
                text ""

        _ ->
            text ""


customAudioBar : Model -> Html msg
customAudioBar model =
    text "audioBar"


goLiveLink : String -> Html Msg
goLiveLink playlist =
    case playlist of
        "" ->
            text ""

        title ->
            a [ onClick (Msgs.StartGoLive title) ] [ text "Go Live" ]


exportPlaylistLink : Html msg
exportPlaylistLink =
    text "exportPlaylistLink"


contentSection : Model -> Html Msg
contentSection model =
    case model.currentPlaylist of
        RemoteData.Success playlist ->
            if playlist.type_ == "music" then
                songArea playlist
            else
                div [ class "video-area" ]
                    [ videoPlayer model
                    , songArea playlist
                    ]

        RemoteData.Loading ->
            text "Loading"

        _ ->
            text ""


songArea : Playlist -> Html Msg
songArea playlist =
    case List.length playlist.songs of
        0 ->
            div [ class "well well-md" ] [ text "There's nothing here.  Add songs to start this playlist!" ]

        _ ->
            div []
                (List.map
                    (\song ->
                        playlistSong
                            song.info
                            song.length
                            (not playlist.isPaused)
                    )
                    playlist.songs
                )


playlistSong : String -> Int -> Bool -> Html Msg
playlistSong info length selected =
    let
        playingIcon =
            if selected then
                span [ class "glyphicon glyphicon-headphones pull-right" ] []
            else
                text ""

        mins =
            floor (toFloat length / 60)

        seconds =
            length - (mins * 60)

        secs =
            if seconds < 10 then
                "0" ++ toString seconds
            else
                toString seconds

        time =
            toString mins ++ ":" ++ secs

        -- add in local state?
        hiddenContent =
            div [ class "panel-body" ]
                [ div [ class "pull-right" ] [ text time ]
                , div [ class "clearfix" ] []
                ]

        -- [ ul [ class "list-group" ]
        --     [ li [ class "list-group-item" ]
        --         [ span [ class "pull-right" ] [ text time ]
        --         , div [ class "clearfix" ] []
        --         ]
        --     ]
        -- ]
    in
    div [ class "panel panel-default" ]
        [ div [ class "panel-heading" ]
            [ h4 [ class "panel-title pull-left" ] [ text info ]
            , playingIcon
            , div [ class "clearfix" ] []
            ]
        , hiddenContent
        ]


videoPlayer : Model -> Html Msg
videoPlayer model =
    let
        videoSource =
            case model.currentSongUrl of
                "" ->
                    []

                song ->
                    [ src song ]

        videoHidden =
            case model.currentSongUrl of
                "" ->
                    [ hidden True ]

                _ ->
                    [ hidden False ]

        videoTag =
            video ([ controls False, style [ ( "width", "85%" ) ] ] ++ videoSource ++ videoHidden) []

        playPauseButton =
            case model.currentPlaylist of
                RemoteData.Success playlist ->
                    span
                        [ class
                            ("glyphicon glyphicon-"
                                ++ (if playlist.isPaused then
                                        "play"
                                    else
                                        "pause"
                                   )
                            )
                        ]
                        []

                _ ->
                    text ""

        currentProgressBar =
            case model.currentPlaylist of
                RemoteData.Success playlist ->
                    progressBar playlist

                _ ->
                    text ""
    in
    div []
        [ div [ class "row" ]
            [ videoTag ]
        , div [ class "row", style [ ( "margin", "20px auto" ) ] ]
            [ div [ class "col-md-3" ]
                [ div [ class "btn-group" ]
                    [ button [ class "btn btn-primary", onClick (Msgs.RewindVideo 30) ]
                        [ span [ class "glyphicon glyphicon-fast-backward" ] [] ]
                    , button [ class "btn btn-primary", onClick (Msgs.RewindVideo 15) ]
                        [ span [ class "glyphicon glyphicon-backward" ] [] ]
                    , button [ class "btn btn-primary", onClick Msgs.PauseMedia ]
                        [ playPauseButton ]
                    ]
                ]
            , div [ class "col-md-7" ]
                [ currentProgressBar ]
            , div [ class "col-md-2" ]
                [ volumeControl model ]
            ]
        ]


progressBar : Playlist -> Html Msg
progressBar playlist =
    let
        barWidth =
            if playlist.length == 0 then
                pct 0
            else
                pct (toFloat playlist.currentTime / (toFloat playlist.length * 100))

        currTimeString =
            "0"

        totalTimeString =
            "100"
    in
    div
        [ styles
            [ backgroundColor (Css.hex "a9a9a9")
            , borderRadius (px 3)
            , top (px 3)
            , Css.width (pct 100)
            , Css.height (px 45)
            ]
        ]
        [ div
            [ styles
                [ backgroundColor (Css.hex "375a7f")
                , borderRadius (px 3)
                , Css.width barWidth
                , Css.height (px 45)
                ]
            ]
            []
        , div
            [ styles
                [ position absolute
                , top (px 12)
                , right (px 20)
                ]
            ]
            [ text (currTimeString ++ " / " ++ totalTimeString) ]
        ]


volumeControl : Model -> Html Msg
volumeControl model =
    input
        [ type_ "range"
        , styles [ position relative, top (px 12) ]
        , Html.Attributes.min "0"
        , Html.Attributes.max "100"
        , defaultValue "25"
        , onInput Msgs.AdjustVolume
        ]
        []
