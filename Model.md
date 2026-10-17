
OmniFlix database models planned.

A file to plan Models Table and their Column Value
This way it is easy for me and AI assistant to know the format of the tables and columns


First is having the ENUM


ENTERTAINMENT_ENUM_TYPE:
    COMIC
    MANGA
    MANWHA
    MANHUA
    NOVEL
    SERIES
    MOVIE


USER_ENTERTAINMENT_LIST_TYPE:
    FAVORITE
    WATCHLIST
    COMPLETED
    ON_HOLD
    PLAN_TO_WATCH
    PLAN_TO_READ
    ACTIVITY
    DROPPED



USER_ENUME_TYPE:
    NORMAL
    ADMIN



Table User:
    Columns:
        id
        username
        hashed_password
        user_type: USER_ENUM_TYPE
        created_at
        profile: Relation to Profile Table


Table User_Profile:
    Columns:
        id
        user_id: Fk users.id
        display_name
        profile_picture_url
        created_at
        update_at

        favorite: Relation with UserEntertainmentList[]
        watchlist: Relation with UserEntertainmentList[]
        completed: Relation with UserEntertainmentList[]
        on_hold: Relation with UserEntertainmentList[]
        plan_to_watch: Relation with UserEntertainmentList[]
        plan_to_read: Relation with UserEntertainmentList[]
        dropped: Relation with UserEnterainmentList[]
        activity: Relation with Activity[]
        search_hsitory: Relation with Search[]


Table User_Entertainment:
    Columns:
        id
        profile_id: Fk profile.id
        external_id
        api_source
        entertainment_purpose_type: ENTERTAINMENT_ENUM_LIST_TYPE
        entertainment_type: ENTERTAINMENT_ENUM_TYPE
        created_at: default time


Table User_Activity:
    Columns:
        id
        profile_id: Fk profile.id
        external_id
        api_source
        entertainment_type: ENTERTAINMENT_ENUM_TYPE
        has_read: Optional boolean, default True
        has_watch: Optional boolean, default True
        created_at: default datetime


Table User_Search:
    Columns:
        id
        profile_id: Fk profile.id
        title: Optional
        genre: Optional
        entertainment_type: ENTERTAINMENT_ENUM_TYPE
        global_search_type: boolean default false, only will become True if user search in global
        created_at: default datetime



